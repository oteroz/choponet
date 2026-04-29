// reactions-view — renderiza la barra de reacciones (chips con conteo + picker).

import { CHOPONET_EMOJIS, toggleReaction } from './reactions-service.js';
import { showToast } from '../ui/toast.js';

export function renderReactionBar(slot, { type, postId, replyId, counts, profile }) {
  if (!slot) return;
  slot.innerHTML = '';

  const bar = document.createElement('div');
  bar.className = 'reactions-bar';

  // Chips activos (emojis con count > 0)
  const activeEntries = Object.entries(counts || {}).filter(([, c]) => c > 0);
  for (const [emoji, count] of activeEntries) {
    const chip = buildChip(emoji, count, { postId, replyId, profile });
    bar.appendChild(chip);
  }

  // Botón + para abrir picker
  const addBtn = document.createElement('button');
  addBtn.className = 'reaction-add';
  addBtn.type = 'button';
  addBtn.setAttribute('aria-label', 'Añadir reacción');
  addBtn.innerHTML = '<span aria-hidden="true">😀</span><span class="reaction-add-plus">+</span>';

  const picker = buildPicker({ postId, replyId, profile });
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    picker.classList.toggle('reaction-picker-open');
  });

  // Cerrar picker al click fuera
  document.addEventListener('click', (e) => {
    if (!bar.contains(e.target)) picker.classList.remove('reaction-picker-open');
  }, { once: true });

  bar.appendChild(addBtn);
  bar.appendChild(picker);

  slot.appendChild(bar);
}

function buildChip(emoji, count, { postId, replyId, profile }) {
  const chip = document.createElement('button');
  chip.className = 'reaction-chip';
  chip.type = 'button';
  chip.innerHTML = `<span aria-hidden="true">${emoji}</span><span class="reaction-count">${count}</span>`;
  chip.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await toggleReaction({ postId, replyId, emoji, profile });
    } catch (err) {
      console.error(err);
      showToast('No pudimos reaccionar', 'error');
    }
  });
  return chip;
}

function buildPicker({ postId, replyId, profile }) {
  const picker = document.createElement('div');
  picker.className = 'reaction-picker';
  for (const emoji of CHOPONET_EMOJIS) {
    const btn = document.createElement('button');
    btn.className = 'reaction-picker-emoji';
    btn.type = 'button';
    btn.textContent = emoji;
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      picker.classList.remove('reaction-picker-open');
      try {
        await toggleReaction({ postId, replyId, emoji, profile });
      } catch (err) {
        console.error(err);
        showToast('No pudimos reaccionar', 'error');
      }
    });
    picker.appendChild(btn);
  }
  return picker;
}
