import './water.css';
import { WaterPrototype } from './water/WaterPrototype.ts';

const container = document.querySelector<HTMLDivElement>('#water-app')!;
try { new WaterPrototype(container); }
catch(error) {
  container.textContent = `無法啟動水景，請確認瀏覽器支援 WebGL2 並重新整理。${error instanceof Error?error.message:String(error)}`;
  console.error(error);
}
