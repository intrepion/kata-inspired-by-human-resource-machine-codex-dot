import {test,expect} from '@playwright/test';
import {puzzles} from '../../src/puzzles';
test('editor, jumps, step, error, certification, progression and reload',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.getByRole('heading',{name:'First post'})).toBeVisible();
 await expect(page.getByRole('button',{name:/Carbon copies/})).toBeDisabled();
 await page.getByRole('button',{name:'+ OUTBOX',exact:true}).click();await page.getByRole('button',{name:'Step →',exact:true}).click();await expect(page.getByRole('status')).toContainText('empty hands');
 await page.getByRole('button',{name:'Clear tape',exact:true}).click();
 for(const op of ['INBOX','OUTBOX','JUMP'])await page.getByRole('button',{name:`+ ${op}`,exact:true}).click();
 await page.getByLabel('Target for L3').selectOption('L1');
 await page.getByLabel('Move L3 up').click();await expect(page.locator('.instruction').nth(1)).toContainText('L3');await page.getByLabel('Target for L3').selectOption('L1');await page.getByLabel('Move L3 down').click();
 await page.getByLabel('Operation 2').selectOption('INBOX');await page.getByLabel('Operation 2').selectOption('OUTBOX');
 await page.getByRole('button',{name:'Step →',exact:true}).click();await expect(page.getByLabel('Courier carrying 4')).toBeVisible();await expect(page.locator('.room-footer')).toContainText('PC 2');
 await page.getByRole('button',{name:'Step →',exact:true}).click();await expect(page.getByLabel('Courier carrying nothing')).toBeVisible();await expect(page.locator('.outgoing .box')).toHaveText(['4']);
 await page.getByRole('button',{name:'Step →',exact:true}).click();await expect(page.locator('.room-footer')).toContainText('PC 1');
 await page.getByRole('button',{name:'↺ Reset',exact:true}).click();await page.getByRole('button',{name:'▶ Run',exact:true}).click();await expect(page.getByRole('button',{name:'Ⅱ Pause',exact:true})).toBeVisible();await page.getByRole('button',{name:'Ⅱ Pause',exact:true}).click();
 await page.getByRole('button',{name:'Certify route ↗',exact:true}).click();await expect(page.getByRole('status')).toContainText('All 7 batches certified');await expect(page.getByRole('button',{name:/Carbon copies/})).toBeEnabled();
 await page.reload();await expect(page.locator('.instruction')).toHaveCount(3);await expect(page.getByRole('button',{name:/Carbon copies/})).toBeEnabled();await page.getByRole('button',{name:'Next assignment →'}).click();await expect(page.getByRole('heading',{name:'Carbon copies'})).toBeVisible();
 await page.getByRole('button',{name:'+ COPYTO',exact:true}).click();await page.getByLabel('Floor for L1').selectOption('2');await page.reload();await expect(page.getByLabel('Floor for L1')).toHaveValue('2');expect(errors).toEqual([]);
});
test('all puzzles certify through the UI; mobile has no horizontal overflow',async({page})=>{
 await page.goto('/');await page.evaluate(p=>localStorage.setItem('copperline-v1',JSON.stringify({programs:Object.fromEntries(p.map(x=>[x.id,x.solution])),completed:p.map(x=>x.id),selected:'relay'})),puzzles);await page.reload();
 for(const p of puzzles){await page.getByRole('button',{name:new RegExp(p.title)}).click();await page.getByRole('button',{name:'Certify route ↗',exact:true}).click();await expect(page.getByRole('status')).toContainText(`All ${p.cases.length} batches certified`);}
 await page.setViewportSize({width:390,height:844});await expect(page.getByRole('button',{name:'Certify route ↗'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:/First post/}).click();await page.screenshot({path:'test-results/desktop.png',fullPage:true});
});
test('drag reorder preserves labels and missing jump targets are reported',async({page})=>{await page.goto('/');for(const op of ['INBOX','OUTBOX','JUMP'])await page.getByRole('button',{name:`+ ${op}`,exact:true}).click();await page.locator('[data-id="L3"]').dragTo(page.locator('[data-id="L2"]'));await expect(page.locator('.instruction').nth(1)).toContainText('L3');await page.getByLabel('Remove L1').click();await page.getByRole('button',{name:'Certify route ↗'}).click();await expect(page.getByRole('status')).toContainText('existing jump label');});
