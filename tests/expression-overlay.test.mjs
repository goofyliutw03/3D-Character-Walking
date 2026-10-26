import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ExpressionOverlay } from '../src/expression/ExpressionOverlay.ts';

class Element {
  children = []; attributes = {}; style = {}; hidden = false; textContent = ''; removed = 0;
  clientWidth = 300; clientHeight = 220; offsetWidth = 240; offsetHeight = 80;
  ownerDocument = { createElement: () => new Element() };
  append(...nodes) { this.children.push(...nodes); }
  setAttribute(key, value) { this.attributes[key] = value; }
  remove() { this.removed++; }
}
test('expressions 2.2,2.3,3.4,3.5: literal content, empty/null hide, clipped layout and disposal', () => {
  const container = new Element();
  const overlay = new ExpressionOverlay(container);
  const root = container.children[0], box = root.children[0];
  const [icon, speech] = box.children;
  overlay.setContent({ emotion: 'happy', speech: '<script>literal</script>\nhello' }, '😊');
  overlay.place({ x: 295, y: 3 });
  assert.equal(root.hidden, false);
  assert.equal(root.attributes['aria-hidden'], 'true');
  assert.equal(icon.textContent, '😊');
  assert.equal(speech.textContent, '<script>literal</script>\nhello');
  assert.ok(parseFloat(box.style.left) + 295 >= 8);
  assert.ok(parseFloat(box.style.left) + 295 + 240 <= 292);
  assert.ok(parseFloat(box.style.top) + 3 >= 8);
  overlay.place(null);
  assert.equal(root.hidden, true);
  overlay.setContent({ emotion: 'none', speech: ' \n ' }, '');
  overlay.place({ x: 100, y: 100 });
  assert.equal(root.hidden, true);
  overlay.dispose(); overlay.dispose();
  assert.equal(root.removed, 1);
});
