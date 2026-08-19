let hoveredRow = null;
if (typeof window !== 'undefined') {
  window.addEventListener('mouseover', (e) => {
    const tr = e.target.closest('tr');
    hoveredRow = tr;
  });
}

export function initializeKeyboardShortcuts() {
  if (typeof window === 'undefined') return;

  window.addEventListener('keydown', (e) => {
    // 1. Determine if it is a shortcut key
    const isCtrl = e.ctrlKey || e.metaKey;
    const isAlt = e.altKey;
    const key = (e.key || '').toLowerCase();

    let action = null;
    if (isCtrl && !isAlt && key === 'i') {
      e.preventDefault();
      e.stopPropagation();
      const fullUrl = window.location.origin + '/item-masters/item-master';
      window.open(fullUrl, '_blank');
      return;
    } else if (isCtrl && !isAlt && key === 's') {
      action = 'save';
    } else if (!isCtrl && isAlt && key === 'c') {
      action = 'create';
    } else if (!isCtrl && isAlt && key === 'e') {
      action = 'edit';
    } else if (!isCtrl && isAlt && key === 'd') {
      action = 'display';
    }

    if (!action) return;

    // Prevent default browser behavior immediately to block browser menus and default hotkeys
    e.preventDefault();
    e.stopPropagation();

    // 2. Find target element
    // Check if there is an element explicitly declaring this shortcut first
    let target = document.querySelector(`[data-shortcut="${action}"]`);

    // Prioritize row-level buttons if a row is hovered or selected
    if (!target && (action === 'edit' || action === 'display')) {
      const activeRow = hoveredRow || document.querySelector('tr[class*="bg-[#0097A7]/10"], tr[class*="selected"], tr[class*="active"]');
      if (activeRow) {
        const rowElements = Array.from(activeRow.querySelectorAll('button, input[type="button"], [role="button"], a.btn'));
        
        if (action === 'edit') {
          target = rowElements.find(el => {
            const txt = (el.textContent || el.value || '').trim().toLowerCase();
            const title = (el.getAttribute('title') || '').trim().toLowerCase();
            const innerHtml = el.innerHTML.toLowerCase();
            return (txt === 'edit' || txt.includes('edit') || title.includes('edit') || innerHtml.includes('pencil') || innerHtml.includes('edit')) && !txt.includes('delete') && !title.includes('delete');
          });
        } else if (action === 'display') {
          target = rowElements.find(el => {
            const txt = (el.textContent || el.value || '').trim().toLowerCase();
            const title = (el.getAttribute('title') || '').trim().toLowerCase();
            const innerHtml = el.innerHTML.toLowerCase();
            return (txt.includes('view') || txt.includes('display') || txt.includes('print') || title.includes('view') || title.includes('display') || title.includes('print') || innerHtml.includes('eye') || innerHtml.includes('printer'));
          });
        }
      }
    }

    if (!target) {
      // Get all visible clickable elements
      const elements = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"], a.btn'));

      if (action === 'save') {
        // Look for buttons containing "save", "submit", "update", or exactly "create" (form submit button text)
        target = elements.find(el => {
          const txt = (el.textContent || el.value || '').trim().toLowerCase();
          const isSubmitType = el.getAttribute('type') === 'submit';
          return txt.includes('save') || txt.includes('submit') || txt === 'update' || txt === 'create' || isSubmitType;
        });
      } else if (action === 'create') {
        // Look for buttons containing "create new", "add new", "new entry", "+", or "clear" (excluding table row actions)
        target = elements.find(el => {
          if (el.closest('tr')) return false;
          const txt = (el.textContent || el.value || '').trim().toLowerCase();
          return txt.includes('create new') || txt.includes('add new') || txt.includes('new entry') || txt === 'new' || txt === '+' || txt.includes('clear');
        });
      } else if (action === 'edit') {
        // Look for buttons containing "edit", "modify" (excluding table row actions and delete/print)
        target = elements.find(el => {
          if (el.closest('tr')) return false;
          const txt = (el.textContent || el.value || '').trim().toLowerCase();
          return (txt === 'edit' || txt.includes('edit') || txt === 'modify') && !txt.includes('delete') && !txt.includes('print');
        });
      } else if (action === 'display') {
        // Look for buttons containing "display", "view", "search", "list" (excluding table row actions)
        target = elements.find(el => {
          if (el.closest('tr')) return false;
          const txt = (el.textContent || el.value || '').trim().toLowerCase();
          return txt.includes('display') || txt.includes('view') || txt.includes('search') || txt.includes('list');
        });
      }
    }

    // 3. Trigger action
    if (target && typeof target.click === 'function') {
      // Blur active element to ensure focused input states sync before submission
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      target.click();
    }
  });
}
