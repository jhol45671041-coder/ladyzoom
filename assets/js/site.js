/**
 * LadyZoom storefront behaviour.
 *
 * Every page is complete without this file. It adds the shopping bag, the
 * menu and bag drawers, sorting on listing pages, the moving row of
 * bestsellers, and the checkout handoff to WhatsApp. The catalogue and
 * settings it needs come from store-data.js (window.LZ_STORE), which the build
 * generates from src/data.
 */
(() => {
  'use strict';

  const store = window.LZ_STORE;
  if (!store) return;

  const BAG_KEY = 'ladyzoom:bag';
  /** The WhatsApp link of the order just handed over, kept for this tab only. */
  const ORDER_KEY = 'ladyzoom:order';
  const MAX_QUANTITY = 10;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const supportsDialog = typeof HTMLDialogElement === 'function';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /** 18950 → "Rs. 18,950", the same format the build uses. */
  const formatPrice = (amount) =>
    `${store.currencySymbol}\u00A0${String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  const productFor = (id) =>
    Object.prototype.hasOwnProperty.call(store.products, id) ? store.products[id] : undefined;

  /* ---------- Messages for screen readers --------------------------------- */

  const liveRegion = $('[data-live]');

  function announce(message) {
    if (!liveRegion) return;
    // Clearing first makes a repeated message get read out again.
    liveRegion.textContent = '';
    requestAnimationFrame(() => {
      liveRegion.textContent = message;
    });
  }

  /* ---------- The bag ------------------------------------------------------
     Stored in the browser as [{ id, size, quantity }]. Names, prices and
     photos are always looked up from the current catalogue, so a bag saved
     last week shows today's prices. */

  const lineKey = (line) => `${line.id}|${line.size}`;

  /** Keeps only lines that still match the catalogue, and merges duplicates. */
  function cleanLines(saved) {
    if (!Array.isArray(saved)) return [];
    const byKey = new Map();
    for (const entry of saved) {
      if (!entry || typeof entry !== 'object') continue;
      const product = productFor(entry.id);
      if (!product || !product.sizes.includes(entry.size)) continue;
      if (!Number.isInteger(entry.quantity) || entry.quantity < 1) continue;
      const key = lineKey(entry);
      const already = byKey.has(key) ? byKey.get(key).quantity : 0;
      byKey.set(key, {
        id: entry.id,
        size: entry.size,
        quantity: Math.min(MAX_QUANTITY, already + entry.quantity),
      });
    }
    return [...byKey.values()];
  }

  function loadLines() {
    try {
      return cleanLines(JSON.parse(localStorage.getItem(BAG_KEY)));
    } catch {
      return []; // storage blocked, or its contents are not ours
    }
  }

  function saveLines() {
    try {
      localStorage.setItem(BAG_KEY, JSON.stringify(lines));
    } catch {
      // Storage is blocked or full. The bag still works until the page is left.
    }
  }

  let lines = loadLines();

  function totals() {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = lines.reduce((sum, line) => sum + productFor(line.id).price * line.quantity, 0);
    const delivery = count === 0 || subtotal >= store.delivery.freeOver ? 0 : store.delivery.fee;
    return { count, subtotal, delivery, total: subtotal + delivery };
  }

  function commit() {
    saveLines();
    renderBag();
  }

  function addToBag(id, size) {
    const line = lines.find((candidate) => candidate.id === id && candidate.size === size);
    if (line) line.quantity = Math.min(MAX_QUANTITY, line.quantity + 1);
    else lines.push({ id, size, quantity: 1 });
    forgetOrder(); // shopping again: the last order's confirmation is finished with
    commit();
  }

  function setQuantity(line, quantity) {
    line.quantity = Math.max(1, Math.min(MAX_QUANTITY, quantity));
    commit();
  }

  function removeLine(line) {
    lines = lines.filter((candidate) => candidate !== line);
    commit();
  }

  function reloadBag() {
    lines = loadLines();
    renderBag();
  }

  // Another tab changed the bag.
  window.addEventListener('storage', (event) => {
    if (event.key === BAG_KEY || event.key === null) reloadBag();
  });

  // Coming back with the browser's Back button can restore this page exactly
  // as it was left, so catch up with anything added to the bag since.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) reloadBag();
  });

  /* ---------- Drawing the bag --------------------------------------------- */

  const lineTemplate = $('#bag-line');

  function buildLine(line) {
    const product = productFor(line.id);
    const node = lineTemplate.content.firstElementChild.cloneNode(true);
    const described = `${product.name}, size ${line.size}`;
    node.dataset.key = lineKey(line);
    for (const link of $$('[data-line-link]', node)) link.href = product.url;
    $('[data-line-image]', node).src = product.image;
    $('[data-line-name]', node).textContent = product.name;
    $('[data-line-title]', node).textContent = product.title;
    $('[data-line-size]', node).textContent = `Size ${line.size}`;
    $('[data-line-stepper]', node).setAttribute('aria-label', `Quantity of ${described}`);
    $('[data-line-remove]', node).setAttribute('aria-label', `Remove ${described}`);
    return node;
  }

  function updateLine(node, line) {
    $('[data-line-quantity]', node).textContent = line.quantity;
    $('[data-line-total]', node).textContent = formatPrice(productFor(line.id).price * line.quantity);
    // aria-disabled rather than disabled, so a button never loses focus mid-use.
    $('[data-line-decrease]', node).setAttribute('aria-disabled', String(line.quantity <= 1));
    $('[data-line-increase]', node).setAttribute('aria-disabled', String(line.quantity >= MAX_QUANTITY));
  }

  /** Brings one list of bag lines up to date, touching only what changed so focus stays put. */
  function renderLines(list) {
    const wanted = lines.map(lineKey);
    for (const node of $$('.bag-line', list)) {
      if (!wanted.includes(node.dataset.key)) node.remove();
    }
    const kept = $$('.bag-line', list);
    if (!kept.every((node, index) => node.dataset.key === wanted[index])) list.replaceChildren();

    lines.forEach((line, index) => {
      let node = list.children[index];
      if (!node) {
        node = buildLine(line);
        list.append(node);
      }
      updateLine(node, line);
    });
  }

  function renderBag() {
    const { count, subtotal, delivery, total } = totals();
    const itemCount = `${count} ${count === 1 ? 'item' : 'items'}`;

    for (const badge of $$('[data-bag-count]')) badge.textContent = count;
    for (const button of $$('[data-bag-button]')) {
      // styles.css reads data-count to hide the small badge while the bag is empty.
      button.dataset.count = count;
      button.setAttribute('aria-label', count === 0 ? 'Open bag' : `Open bag, ${itemCount}`);
    }

    for (const list of $$('[data-bag-lines]')) renderLines(list);
    for (const element of $$('[data-bag-empty]')) element.hidden = count > 0;
    for (const element of $$('[data-bag-filled]')) element.hidden = count === 0;

    for (const element of $$('[data-bag-subtotal]')) element.textContent = formatPrice(subtotal);
    for (const element of $$('[data-bag-delivery]')) {
      element.textContent = delivery === 0 ? 'Complimentary' : formatPrice(delivery);
    }
    for (const element of $$('[data-bag-total]')) element.textContent = formatPrice(total);

    // How close the order is to free delivery. Hidden if delivery is always free.
    const { fee, freeOver } = store.delivery;
    const remaining = freeOver - subtotal;
    for (const element of $$('[data-bag-progress]')) element.hidden = fee === 0;
    for (const element of $$('[data-bag-progress-text]')) {
      element.textContent =
        remaining > 0
          ? `Add ${formatPrice(remaining)} more for complimentary delivery.`
          : 'Your order qualifies for complimentary delivery.';
    }
    for (const element of $$('[data-bag-progress-bar]')) {
      element.style.width = `${freeOver > 0 ? Math.min(1, subtotal / freeOver) * 100 : 100}%`;
    }

    syncCheckout();
  }

  // Quantity and remove buttons, wherever a bag line is shown.
  document.addEventListener('click', (event) => {
    const node = event.target.closest('.bag-line');
    if (!node) return;
    const line = lines.find((candidate) => lineKey(candidate) === node.dataset.key);
    if (!line) return;
    const product = productFor(line.id);

    const step = event.target.closest('[data-line-increase], [data-line-decrease]');
    if (step) {
      if (step.getAttribute('aria-disabled') === 'true') return; // already at the limit
      setQuantity(line, line.quantity + (step.matches('[data-line-increase]') ? 1 : -1));
      announce(`${product.name}: quantity ${line.quantity}.`);
    } else if (event.target.closest('[data-line-remove]')) {
      // Decide where focus goes before the line disappears from under it.
      const neighbour = node.nextElementSibling || node.previousElementSibling;
      const dialog = node.closest('dialog');
      removeLine(line);
      const next = neighbour
        ? $('[data-line-remove]', neighbour)
        : dialog
          ? $('[data-close]', dialog)
          : $('[data-checkout-empty] a');
      if (next) next.focus();
      announce(`${product.name} removed from your bag.`);
    }
  });

  /* ---------- Drawers and dialogs ----------------------------------------- */

  function openDialog(dialog) {
    if (dialog.open) return;
    dialog.classList.remove('is-closing');
    dialog.showModal();
  }

  /**
   * Closes a dialog once its closing animation has played. styles.css starts
   * that animation on .is-closing; where there is none (reduced motion), the
   * dialog closes straight away.
   */
  function closeDialog(dialog) {
    if (!dialog || !dialog.open || dialog.classList.contains('is-closing')) return;
    dialog.classList.add('is-closing');
    const animations = dialog.getAnimations ? dialog.getAnimations() : [];
    Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      dialog.classList.remove('is-closing');
      if (dialog.open) dialog.close();
    });
  }

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-open]');
    if (opener) {
      const name = opener.dataset.open;
      const dialog = document.getElementById(name);
      if (dialog && supportsDialog) openDialog(dialog);
      // Very old browsers have no <dialog>: fall back to plain navigation.
      else if (name === 'bag') window.location.href = 'checkout.html';
      else if (name === 'menu') $('#footer').scrollIntoView();
      return;
    }
    const closer = event.target.closest('[data-close]');
    if (closer) closeDialog(closer.closest('dialog'));
  });

  if (supportsDialog) {
    for (const dialog of $$('dialog')) {
      // A click that both starts and ends on the dimmed backdrop closes the dialog.
      let pressedOnBackdrop = false;
      dialog.addEventListener('pointerdown', (event) => {
        pressedOnBackdrop = event.target === dialog;
      });
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog && pressedOnBackdrop) closeDialog(dialog);
      });
      // Escape: animate the close instead of letting it snap shut.
      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeDialog(dialog);
      });
    }

    // Leaving the page closes anything open, so Back returns to a clean page.
    window.addEventListener('pagehide', () => {
      for (const dialog of $$('dialog[open]')) dialog.close();
    });
  }

  /* ---------- Product page: choose a size, add to bag --------------------- */

  const buyForm = $('[data-buy]');
  if (buyForm) {
    const product = productFor(buyForm.dataset.buy);
    const error = $('[data-buy-error]', buyForm);
    const options = $('[role="radiogroup"]', buyForm);

    buyForm.addEventListener('change', () => {
      error.hidden = true;
      options.removeAttribute('aria-invalid');
    });

    buyForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const size = new FormData(buyForm).get('size');
      if (!size) {
        error.hidden = false;
        options.setAttribute('aria-invalid', 'true');
        announce(error.textContent);
        $('input[name="size"]', buyForm).focus();
        return;
      }
      addToBag(buyForm.dataset.buy, size);
      announce(`${product.name}, size ${size}, added to your bag.`);
      const bag = $('#bag');
      if (bag && supportsDialog) openDialog(bag);
    });
  }

  /* ---------- Listing pages: sort ------------------------------------------ */

  const sortSelect = $('[data-sort]');
  const sortGrid = $('[data-sort-grid]');
  if (sortSelect && sortGrid && sortGrid.children.length > 1) {
    const byCatalogueOrder = (a, b) => a.dataset.index - b.dataset.index;
    const comparers = new Map([
      ['featured', byCatalogueOrder],
      ['price-asc', (a, b) => a.dataset.price - b.dataset.price || byCatalogueOrder(a, b)],
      ['price-desc', (a, b) => b.dataset.price - a.dataset.price || byCatalogueOrder(a, b)],
    ]);

    const applySort = (order) => {
      sortGrid.append(...Array.from(sortGrid.children).sort(comparers.get(order)));
    };

    const withSort = (address, order) => {
      const url = new URL(address, window.location.href);
      if (order === 'featured') url.searchParams.delete('sort');
      else url.searchParams.set('sort', order);
      return url;
    };

    /** Carries the chosen order over to the other collection tabs. */
    const syncTabs = (order) => {
      for (const tab of $$('.tabs a')) tab.href = withSort(tab.href, order);
    };

    // The order lives in the address (?sort=price-asc), so Back and shared links keep it.
    const requested = new URLSearchParams(window.location.search).get('sort');
    const initial = comparers.has(requested) ? requested : 'featured';
    sortSelect.value = initial;
    if (initial !== 'featured') {
      applySort(initial);
      syncTabs(initial);
    }
    $('[data-sort-control]').hidden = false;

    sortSelect.addEventListener('change', () => {
      const order = sortSelect.value;
      applySort(order);
      syncTabs(order);
      window.history.replaceState(window.history.state, '', withSort(window.location.href, order));
    });
  }

  /* ---------- Checkout ------------------------------------------------------
     There is no payment gateway. Placing an order opens WhatsApp with the
     order written out as a message to the store's number. Until a number is
     set in src/data/site.mjs, WhatsApp asks which chat to send it to. */

  const checkout = $('[data-checkout]');

  /**
   * The WhatsApp link of the order just handed over, or ''. It is remembered
   * for this tab, because phones often reload the page while the customer is
   * away in WhatsApp, and they should come back to the confirmation rather
   * than to an empty bag.
   */
  function savedOrder() {
    try {
      const link = sessionStorage.getItem(ORDER_KEY) || '';
      return link.startsWith('https://wa.me/') ? link : '';
    } catch {
      return '';
    }
  }

  function rememberOrder(link) {
    try {
      sessionStorage.setItem(ORDER_KEY, link);
    } catch {
      // Storage is blocked: the confirmation simply will not survive a reload.
    }
  }

  function forgetOrder() {
    try {
      sessionStorage.removeItem(ORDER_KEY);
    } catch {
      // Nothing was stored.
    }
  }

  /** Shows the right one of the three checkout states. */
  function syncCheckout() {
    if (!checkout) return;
    // The confirmation shows only while the bag is empty; a new bag is a new order.
    const orderLink = lines.length === 0 ? savedOrder() : '';
    if (orderLink) $('[data-checkout-reopen]', checkout).href = orderLink;
    $('[data-checkout-done]', checkout).hidden = !orderLink;
    $('[data-checkout-empty]', checkout).hidden = Boolean(orderLink) || lines.length > 0;
    $('[data-checkout-main]', checkout).hidden = lines.length === 0;
  }

  /** The order as a WhatsApp message. Asterisks make text bold there. */
  function orderMessage(details) {
    const plainPrice = (amount) => formatPrice(amount).replace('\u00A0', ' ');
    const { subtotal, delivery, total } = totals();
    const items = lines.map((line, index) => {
      const product = productFor(line.id);
      return `${index + 1}. ${product.name} (${product.title})\n    Size ${line.size} × ${line.quantity}: ${plainPrice(product.price * line.quantity)}`;
    });
    return [
      `*New order for ${store.name}*`,
      '',
      ...items,
      '',
      `Subtotal: ${plainPrice(subtotal)}`,
      `Delivery: ${delivery === 0 ? 'Complimentary' : plainPrice(delivery)}`,
      `*Total: ${plainPrice(total)}*`,
      'Payment: Cash on delivery',
      '',
      '*Deliver to*',
      details.name,
      details.phone,
      `${details.address}, ${details.city}`,
      ...(details.notes ? ['', `Notes: ${details.notes}`] : []),
    ].join('\n');
  }

  const checkoutForm = $('[data-checkout-form]');
  if (checkoutForm) {
    const fields = checkoutForm.elements;

    checkoutForm.addEventListener('input', (event) => {
      if (event.target.setCustomValidity) event.target.setCustomValidity('');
    });

    /** Points out a problem with one field, in the browser's own style. */
    const reject = (field, message) => {
      field.setCustomValidity(message);
      field.reportValidity();
    };

    checkoutForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (lines.length === 0) return;

      const details = {};
      for (const name of ['name', 'phone', 'address', 'city', 'notes']) {
        details[name] = fields[name].value.trim().replace(/\s+/g, ' ');
        if (fields[name].required && details[name] === '') {
          reject(fields[name], 'Please fill in this field.');
          return;
        }
      }
      const digits = details.phone.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        reject(fields.phone, 'Please enter a valid phone number.');
        return;
      }

      const orderLink = `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(orderMessage(details))}`;
      window.open(orderLink, '_blank', 'noopener');

      rememberOrder(orderLink);
      lines = [];
      commit(); // empties the bag, which switches the page to the confirmation

      const done = $('[data-checkout-done]', checkout);
      done.focus({ preventScroll: true });
      done.scrollIntoView({ block: 'center' });
      announce('Your order is ready in WhatsApp. Press send there to place it.');
    });
  }

  /* ---------- Rails ---------------------------------------------------------
     A rail is a row of cards that scrolls sideways. It works by touch, wheel
     and keyboard on its own. This adds arrow buttons, which go round and round
     rather than stopping at the ends, and moves a rail marked data-rail-auto
     along by itself while it is on screen.

     Going round is done by changing the order the cards are laid out in (CSS
     `order`), never by moving them in the page, so the order they are read
     and tabbed through stays as written. */

  const RAIL_GLIDE = 900; // ms: one card sliding along by itself
  const RAIL_GLIDE_QUICK = 500; // ms: the same, in answer to an arrow button
  const RAIL_FIRST = 900; // ms: from the row coming on screen to its first move
  const RAIL_REST = 2600; // ms: each card's rest between moves
  const RAIL_HOLD = 6000; // ms: left alone after the visitor moves the row themselves
  const RAIL_PHOTOS = 400; // ms: between looks at whether the row's photos have arrived

  for (const rail of $$('[data-rail]')) {
    const controls = $(`[data-rail-controls="${rail.id}"]`);
    if (!controls) continue;
    const previous = $('[data-rail-prev]', controls);
    const next = $('[data-rail-next]', controls);
    const toggle = $('[data-rail-toggle]', controls);
    const cards = Array.from(rail.children);

    let head = 0; // which card is laid out first
    let at = rail.scrollLeft; // where this script last put the row
    let frame = 0; // the animation frame of a glide in progress
    let goal = 0; // where that glide is heading
    /** Puts off the row's next move by itself. Does nothing unless the rail moves by itself. */
    let wait = () => {};

    const overflow = () => rail.scrollWidth - rail.clientWidth;
    /** The card laid out at a position: 0 is the first, -1 the last. */
    const card = (position) => cards[(head + position + cards.length) % cards.length];
    /** One card plus the gap after it. */
    const step = () => card(1).getBoundingClientRect().left - card(0).getBoundingClientRect().left;

    const place = (left) => {
      rail.scrollLeft = left;
      at = rail.scrollLeft;
    };

    /** Stops a glide where it stands; the row then settles on the nearest card. */
    const halt = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
      rail.classList.remove('is-gliding');
    };

    const glide = (to, duration) => {
      const from = rail.scrollLeft;
      goal = to;
      const finish = () => {
        frame = 0;
        place(to);
        rail.classList.remove('is-gliding');
      };
      if (reducedMotion.matches || Math.abs(to - from) < 1) {
        finish();
        return;
      }
      const began = performance.now();
      const draw = (now) => {
        const progress = Math.min(1, Math.max(0, (now - began) / duration));
        if (progress === 1) {
          finish();
          return;
        }
        const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        place(from + (to - from) * eased);
        frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
    };

    /** Lays the cards out starting one card later (1) or earlier (-1), keeping what is in view where it is. */
    const turn = (direction, by) => {
      head = (head + direction + cards.length) % cards.length;
      cards.forEach((element, index) => {
        element.style.order = String((index - head + cards.length) % cards.length);
      });
      place(rail.scrollLeft - direction * by);
    };

    /** Moves the row one card along: 1 for onwards, -1 for back. */
    const shift = (direction, duration) => {
      const furthest = overflow();
      if (cards.length < 2 || furthest <= 1) return;
      if (frame) {
        // A glide is under way: complete it first.
        cancelAnimationFrame(frame);
        frame = 0;
        place(goal);
      }
      // While this script moves the row, it must not snap to a card of its own accord.
      rail.classList.add('is-gliding');

      const by = step();
      if (!(by > 0)) {
        rail.classList.remove('is-gliding');
        return;
      }
      const box = rail.getBoundingClientRect();
      /** The next place, in this direction, where a card lines up with the start of the row. */
      const stop = (from) => (direction > 0 ? Math.ceil((from + 1) / by) : Math.floor((from - 1) / by)) * by;

      const from = rail.scrollLeft;
      let to = stop(from);
      if (to > furthest + 1 || to < -1) {
        // That is past the end of the row. If the card at the other end is out
        // of sight, lay it out at this end and carry on in the same direction.
        const spare = card(direction > 0 ? 0 : -1).getBoundingClientRect();
        const outOfSight = direction > 0 ? spare.right <= box.left + 1 : spare.left >= box.right - 1;
        if (outOfSight) {
          turn(direction, by);
          to = stop(rail.scrollLeft);
        } else if (direction > 0) {
          to = from < furthest - 1 ? furthest : 0;
        } else {
          to = from > 1 ? 0 : furthest;
        }
      }
      to = Math.max(0, Math.min(furthest, to));
      // Going all the way back takes a little longer than one card.
      glide(to, Math.abs(to - rail.scrollLeft) > by * 1.5 ? duration * 1.5 : duration);
    };

    const sync = () => {
      controls.hidden = cards.length < 2 || overflow() <= 1;
    };

    previous.addEventListener('click', () => {
      shift(-1, RAIL_GLIDE_QUICK);
      wait(RAIL_HOLD);
    });
    next.addEventListener('click', () => {
      shift(1, RAIL_GLIDE_QUICK);
      wait(RAIL_HOLD);
    });
    rail.addEventListener(
      'scroll',
      () => {
        // Movement this script did not make is the visitor's (a swipe, a
        // trackpad, the Tab key): the row is theirs for a while.
        if (Math.abs(rail.scrollLeft - at) <= 2) return;
        at = rail.scrollLeft;
        halt();
        wait(RAIL_HOLD);
      },
      { passive: true },
    );
    window.addEventListener('resize', sync);
    sync();

    /* Moving by itself. The row advances a card at a time while at least half
       of it is on screen, and stands still:
         - for visitors who have asked their device to reduce motion;
         - while the pointer is being used over it, a finger is on it, or the
           keyboard is in it, so that nothing moves from under a tap or a click;
         - once the pause button is pressed, until it is pressed again;
         - while the page is in a background tab. */
    if (!toggle || !rail.hasAttribute('data-rail-auto') || !('IntersectionObserver' in window)) continue;

    let onScreen = false;
    let pointing = false; // the pointer has moved over the row and not yet left
    let touching = false;
    let stopped = false; // by the pause button
    let arrivedAt = null; // where the pointer was when the row came under it
    let timer = 0;

    // A card must not slide into view empty. Its photo would otherwise be
    // fetched only as it comes into sight, so every card's photo is asked for
    // as the row comes near, and the row waits for them before it moves. (The
    // second photo, shown on hover, is left to load when its card is in view.)
    const photos = $$('.card__media img:not(.card__alt)', rail);
    const fetchPhotos = () => {
      for (const photo of photos) photo.loading = 'eager';
    };
    // A photo that failed to load counts as arrived: the row does not wait for it.
    const photosHere = () => photos.every((photo) => photo.complete);

    const keyboardInside = () => {
      try {
        return Boolean(rail.querySelector(':focus-visible'));
      } catch {
        return rail.contains(document.activeElement); // browsers without :focus-visible
      }
    };

    const free = () =>
      onScreen && !stopped && !pointing && !touching && !document.hidden && !reducedMotion.matches && !keyboardInside();

    wait = (delay) => {
      window.clearTimeout(timer);
      timer = 0;
      if (!free()) return;
      timer = window.setTimeout(() => {
        timer = 0;
        if (!free()) return;
        if (!photosHere()) {
          fetchPhotos();
          wait(RAIL_PHOTOS);
          return;
        }
        shift(1, RAIL_GLIDE);
        wait(RAIL_GLIDE + RAIL_REST);
      }, delay);
    };

    const showToggle = () => {
      toggle.hidden = reducedMotion.matches;
      toggle.classList.toggle('is-paused', stopped);
      toggle.setAttribute('aria-label', stopped ? 'Resume automatic scrolling' : 'Pause automatic scrolling');
    };

    toggle.addEventListener('click', () => {
      stopped = !stopped;
      showToggle();
      wait(RAIL_FIRST);
    });

    // A resting pointer that the page was scrolled under does not hold the row
    // still; one that is then moved, towards a card, does.
    rail.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch') arrivedAt = { x: event.clientX, y: event.clientY };
    });
    rail.addEventListener('pointermove', (event) => {
      if (pointing || event.pointerType === 'touch') return;
      if (arrivedAt && Math.abs(event.clientX - arrivedAt.x) + Math.abs(event.clientY - arrivedAt.y) < 2) return;
      pointing = true;
      wait(RAIL_REST);
    });
    rail.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'touch') return;
      arrivedAt = null;
      pointing = false;
      wait(RAIL_REST);
    });
    rail.addEventListener('pointerdown', () => wait(RAIL_HOLD));

    rail.addEventListener(
      'touchstart',
      () => {
        touching = true;
        halt();
        wait(RAIL_HOLD);
      },
      { passive: true },
    );
    for (const type of ['touchend', 'touchcancel']) {
      rail.addEventListener(
        type,
        (event) => {
          touching = event.touches.length > 0;
          wait(RAIL_HOLD);
        },
        { passive: true },
      );
    }

    rail.addEventListener('focusin', () => wait(RAIL_REST));
    rail.addEventListener('focusout', () => wait(RAIL_REST));
    document.addEventListener('visibilitychange', () => wait(RAIL_REST));
    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener('change', () => {
        showToggle();
        wait(RAIL_FIRST);
      });
    }

    new IntersectionObserver(
      (entries) => {
        onScreen = entries[entries.length - 1].intersectionRatio >= 0.5;
        wait(RAIL_FIRST);
      },
      { threshold: 0.5 },
    ).observe(rail);

    // Within a screen's height of the row: time to fetch its photos.
    const nearby = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        nearby.disconnect();
        if (!reducedMotion.matches) fetchPhotos();
      },
      { rootMargin: '100% 0px' },
    );
    nearby.observe(rail);

    showToggle();
  }

  /* ---------- Updates list --------------------------------------------------
     Joining the list is a WhatsApp message to the store, like an order. The
     form works without this script; here the customer's name is added to it. */

  const joinForm = $('[data-join]');
  if (joinForm) {
    const nameField = $('[data-join-name]', joinForm);
    const status = $('[data-join-status]');

    joinForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = nameField.value.trim().replace(/\s+/g, ' ');
      if (name === '') {
        nameField.value = '';
        nameField.reportValidity();
        return;
      }

      const message = `Hello ${store.name}, please add me to your updates list. My name is ${name}.`;
      window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');

      status.textContent = store.whatsapp
        ? 'WhatsApp has opened with your request. Press send there to join.'
        : 'Preview mode: no store WhatsApp number has been added yet, so WhatsApp will ask which chat to send your request to.';
      status.hidden = false;
      announce(status.textContent);
    });
  }

  /* ---------- Reveal on scroll --------------------------------------------- */

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const waiting = new Set();

    const reveal = (element) => {
      element.classList.add('is-revealed');
      observer.unobserve(element);
      waiting.delete(element);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) reveal(entry.target);
        }
        // A jump down the page (a link to a section, the End key) can pass
        // elements without ever showing them. Settle those too, so nothing
        // above the screen is left waiting.
        for (const element of waiting) {
          if (element.getBoundingClientRect().bottom < 0) reveal(element);
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );

    for (const element of $$('[data-reveal]')) {
      // Only what starts below the fold is animated; anything already on screen stays put.
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.classList.add('will-reveal');
        waiting.add(element);
        observer.observe(element);
      }
    }
  }

  renderBag();
})();
