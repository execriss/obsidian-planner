import { useState, useRef, useCallback } from 'react';

/**
 * Shared drag-to-move hook for WeekView and BigCalendar.
 * Desktop (mouse) only — touch events are ignored.
 *
 * Usage:
 *   const { draggingId, dropKey, didDrag, handlePillPointerDown } = useDragMove(onMoveTask);
 *
 *   <cell data-date-key={key} onClick={() => !didDrag.current && onSelectDate(day)} />
 *   <pill data-task-id={task.id} onPointerDown={e => handlePillPointerDown(e, task, key)} />
 */
export function useDragMove(onMoveTask) {
  const [draggingId, setDraggingId] = useState(null);
  const [dropKey,    setDropKey]    = useState(null);
  const drag    = useRef(null);
  const didDrag = useRef(false);

  const handlePillPointerDown = useCallback((e, task, dateKey) => {
    if (!onMoveTask)              return;
    if (e.pointerType !== 'mouse') return; // desktop only
    if (e.button !== 0)            return;

    drag.current = {
      taskId:    task.id,
      sourceKey: dateKey,
      startX:    e.clientX,
      startY:    e.clientY,
      ghost:     null,
      offsetX:   0,
      offsetY:   0,
      active:    false,
    };

    const onMove = (ev) => {
      const d = drag.current;
      if (!d) return;

      const dx = ev.clientX - d.startX;
      const dy = ev.clientY - d.startY;

      if (!d.active) {
        if (Math.sqrt(dx * dx + dy * dy) < 8) return;

        const pill = document.querySelector(`[data-task-id="${d.taskId}"]`);
        if (!pill) return;
        const rect = pill.getBoundingClientRect();

        const ghost = pill.cloneNode(true);
        ghost.removeAttribute('data-task-id');
        Object.assign(ghost.style, {
          position:      'fixed',
          left:          `${rect.left}px`,
          top:           `${rect.top}px`,
          width:         `${rect.width}px`,
          pointerEvents: 'none',
          zIndex:        '9999',
          opacity:       '0',
          transform:     'scale(1) rotate(0deg)',
          boxShadow:     '0 10px 32px rgba(0,0,0,0.5)',
          borderRadius:  '5px',
          transition:    'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.14s ease',
        });
        document.body.appendChild(ghost);

        // Two rAF so the browser registers the initial state before transitioning
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (!ghost.parentNode) return;
          ghost.style.opacity   = '0.95';
          ghost.style.transform = 'scale(1.1) rotate(-2deg)';
        }));

        d.ghost   = ghost;
        d.offsetX = d.startX - rect.left;
        d.offsetY = d.startY - rect.top;
        d.active  = true;
        didDrag.current = true;
        setDraggingId(d.taskId);
      }

      if (d.active && d.ghost) {
        d.ghost.style.left = `${ev.clientX - d.offsetX}px`;
        d.ghost.style.top  = `${ev.clientY - d.offsetY}px`;

        // Temporarily hide ghost so elementFromPoint finds the cell below
        d.ghost.style.display = 'none';
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        d.ghost.style.display = '';

        const cell = el?.closest('[data-date-key]');
        const key  = cell?.dataset.dateKey ?? null;
        setDropKey(key && key !== d.sourceKey ? key : null);
      }
    };

    const onUp = (ev) => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);
      document.removeEventListener('pointercancel', onUp);

      const d = drag.current;
      if (!d) return;

      if (d.active && d.ghost) {
        d.ghost.style.display = 'none';
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        d.ghost.style.display = '';
        const cell      = el?.closest('[data-date-key]');
        const targetKey = cell?.dataset.dateKey ?? null;

        if (targetKey && targetKey !== d.sourceKey) {
          onMoveTask(d.taskId, { date: targetKey });
        }

        Object.assign(d.ghost.style, {
          transition: 'opacity 0.18s ease, transform 0.18s ease',
          opacity:    '0',
          transform:  'scale(0.85) rotate(0deg)',
        });
        setTimeout(() => d.ghost?.remove(), 200);
      }

      drag.current = null;
      setDraggingId(null);
      setDropKey(null);
      setTimeout(() => { didDrag.current = false; }, 80);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
    document.addEventListener('pointercancel', onUp);
  }, [onMoveTask]);

  return { draggingId, dropKey, didDrag, handlePillPointerDown };
}
