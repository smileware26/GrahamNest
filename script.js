const $ = (id) => document.getElementById(id);
const sampleRows = [
 {type:"item",category:"Ingredients",name:"M.Y San Graham Crushed",packageQty:1000,packageUnit:"g",price:245,usedQty:200,usedUnit:"g"},
 {type:"item",category:"Ingredients",name:"Jersey Condensed",packageQty:390,packageUnit:"g",price:40.75,usedQty:167,usedUnit:"g"},
 {type:"category",name:"Coating"},
 {type:"item",category:"Coating",name:"Butternut Powder",packageQty:250,packageUnit:"g",price:55,usedQty:35,usedUnit:"g"},
 {type:"item",category:"Coating",name:"Crushed Graham",packageQty:1000,packageUnit:"g",price:245,usedQty:7,usedUnit:"g"},
 {type:"item",category:"Coating",name:"Dutché Cocoa Powder",packageQty:100,packageUnit:"g",price:105,usedQty:10,usedUnit:"g"},
 {type:"category",name:"Topping"},
 {type:"item",category:"Topping",name:"Dutché Bittersweet Chocolate Bar",packageQty:500,packageUnit:"g",price:185,usedQty:50,usedUnit:"g"},
 {type:"item",category:"Topping",name:"Baguio Pure Coconut Oil",packageQty:1000,packageUnit:"ml",price:222,usedQty:5,usedUnit:"ml"},
 {type:"item",category:"Topping",name:"Piping Bag",packageQty:50,packageUnit:"pcs",price:30,usedQty:1,usedUnit:"pcs"}
];
let rows = JSON.parse(localStorage.getItem("grahamNestRows") || "null") || structuredClone(sampleRows);
const savedSettings = JSON.parse(localStorage.getItem("grahamNestSettings") || "null");
if(savedSettings){
 $("recipeName").value=savedSettings.recipeName ?? "Graham Nest";
 $("yield").value=savedSettings.yield ?? 22;
 $("sellingPrice").value=savedSettings.sellingPrice ?? 10;
 $("currency").value=savedSettings.currency ?? "₱";
 $("includeOverhead").checked=!!savedSettings.includeOverhead;
 $("overhead").value=savedSettings.overhead ?? 0;
}
$("overhead").disabled=!$("includeOverhead").checked;

function money(n){const currency=$("currency").value;return currency+Number(n||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});}
function safe(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderRows(){
 const tbody=$("ingredientRows");tbody.innerHTML="";
 rows.forEach((r,i)=>{
  if(r.type==="category"){
   const tr=document.createElement("tr");tr.className="category-row";
   tr.innerHTML=`<td colspan="8"><input aria-label="Section heading" value="${safe(r.name)}" data-index="${i}" data-key="name"> <button class="remove-row" title="Remove section" data-remove="${i}">×</button></td>`;
   tbody.appendChild(tr);return;
  }
  const tr=document.createElement("tr");tr.dataset.index=i;
  tr.innerHTML=`
   <td><input class="name-input" aria-label="Ingredient name" value="${safe(r.name)}" data-index="${i}" data-key="name"></td>
   <td><div class="inline-field"><input class="number-input" aria-label="Package quantity" type="number" min="0" step="any" value="${r.packageQty}" data-index="${i}" data-key="packageQty"></div><select aria-label="Package unit" data-index="${i}" data-key="packageUnit">${["g","kg","ml","L","pcs","pack"].map(u=>`<option ${r.packageUnit===u?"selected":""}>${u}</option>`).join("")}</select></td>
   <td><input class="number-input" aria-label="Package price" type="number" min="0" step=".01" value="${r.price}" data-index="${i}" data-key="price"></td>
   <td class="unit-cost" id="unit-${i}">—</td>
   <td><input class="number-input" aria-label="Quantity used" type="number" min="0" step="any" value="${r.usedQty}" data-index="${i}" data-key="usedQty"><select aria-label="Used unit" data-index="${i}" data-key="usedUnit">${["g","kg","ml","L","pcs","pack"].map(u=>`<option ${r.usedUnit===u?"selected":""}>${u}</option>`).join("")}</select></td>
   <td class="calc" id="calc-${i}">—</td><td class="line-total" id="line-${i}">—</td><td><button class="remove-row" title="Remove ingredient" aria-label="Remove ${safe(r.name)}" data-remove="${i}">×</button></td>`;
  tbody.appendChild(tr);
 });
 calculate();
}
function normalized(q,u){if(u==="kg")return q*1000;if(u==="L")return q*1000;if(u==="g"||u==="ml")return q;return q;}
function compatible(a,b){const mass=["g","kg"].includes(a)&&["g","kg"].includes(b);const liquid=["ml","L"].includes(a)&&["ml","L"].includes(b);return mass||liquid||a===b;}
function calcRow(r){const packageQty=Number(r.packageQty)||0, price=Number(r.price)||0, used=Number(r.usedQty)||0;if(packageQty<=0)return {unit:0,cost:0,valid:false};let usedInPackageUnits;
 if(compatible(r.packageUnit,r.usedUnit)){usedInPackageUnits=normalized(used,r.usedUnit)/normalized(1,r.packageUnit);}
 else {usedInPackageUnits=used;}
 // Match the sample sheet: unit cost is shown to 2 decimals and each line total is rounded to the nearest peso.
 const unit=Math.floor((price/packageQty)*100)/100;
 const cost=Math.round(unit*usedInPackageUnits);
 return {unit,cost,valid:true};}
function calculate(){
 const currency=$("currency").value,yieldCount=Math.max(0,Number($("yield").value)||0),selling=Math.max(0,Number($("sellingPrice").value)||0);
 let ingredientCost=0;
 rows.forEach((r,i)=>{if(r.type!=="item")return;const c=calcRow(r);ingredientCost+=c.cost;const unit=$(`unit-${i}`),calc=$(`calc-${i}`),line=$(`line-${i}`);
 if(unit)unit.textContent=c.valid?`${money(c.unit)} / ${r.packageUnit}`:"Check package qty";
 if(calc)calc.textContent=c.valid?`${r.usedQty} ${r.usedUnit} × ${money(c.unit)} / ${r.packageUnit}`:"—";
 if(line)line.textContent=money(c.cost);
 });
 const overhead=$("includeOverhead").checked?Math.max(0,Number($("overhead").value)||0):0;
 const total=ingredientCost+overhead,costPiece=yieldCount?total/yieldCount:0,sales=yieldCount*selling,profit=sales-total,profitPiece=yieldCount?profit/yieldCount:0,margin=sales>0?(profit/sales)*100:0;
 $("yieldOut").innerHTML=`${yieldCount} <small>pcs</small>`;$("priceOut").innerHTML=`${money(selling)} <small>/pc</small>`;
 $("costOut").textContent=money(total);$("profitOut").textContent=money(profit);$("tableTotal").textContent=money(ingredientCost);
 $("resultCost").textContent=money(total);$("costPerPiece").textContent=money(costPiece);$("totalSales").textContent=money(sales);$("batchProfit").textContent=money(profit);$("profitPerPiece").textContent=money(profitPiece);$("profitMargin").textContent=margin.toFixed(2)+"%";
 if(profit>0){$("pricingTitle").textContent="You're making a profit!";$("pricingMessage").textContent=`At ${money(selling)} per piece, this batch earns about ${money(profit)} before any costs you have not included.`;}
 else if(profit<0){$("pricingTitle").textContent="Review your selling price";$("pricingMessage").textContent=`Your current price is below the batch cost by ${money(Math.abs(profit))}. Consider increasing your price or reducing costs.`;}
 else{$("pricingTitle").textContent="Break-even pricing";$("pricingMessage").textContent="Your sales cover the listed batch costs, but there is no profit yet.";}
 saveLocal();
}
function settings(){return {recipeName:$("recipeName").value,yield:$("yield").value,sellingPrice:$("sellingPrice").value,currency:$("currency").value,includeOverhead:$("includeOverhead").checked,overhead:$("overhead").value};}
function saveLocal(){localStorage.setItem("grahamNestRows",JSON.stringify(rows));localStorage.setItem("grahamNestSettings",JSON.stringify(settings()));}
$("ingredientRows").addEventListener("input",e=>{const el=e.target;if(!el.dataset.index||!el.dataset.key)return;const i=Number(el.dataset.index),key=el.dataset.key;if(!rows[i])return;rows[i][key]=["packageQty","price","usedQty"].includes(key)?Number(el.value):el.value;calculate();});
$("ingredientRows").addEventListener("change",e=>{const el=e.target;if(!el.dataset.index||!el.dataset.key)return;const i=Number(el.dataset.index),key=el.dataset.key;if(!rows[i])return;rows[i][key]=["packageQty","price","usedQty"].includes(key)?Number(el.value):el.value;calculate();});
$("ingredientRows").addEventListener("click",e=>{const btn=e.target.closest("[data-remove]");if(btn){rows.splice(Number(btn.dataset.remove),1);renderRows();}});
["recipeName","yield","sellingPrice","currency","overhead"].forEach(id=>$(id).addEventListener("input",calculate));
$("includeOverhead").addEventListener("change",()=>{$("overhead").disabled=!$("includeOverhead").checked;calculate();});
$("addRowBtn").addEventListener("click",()=>{rows.push({type:"item",category:"Ingredients",name:"New ingredient",packageQty:1000,packageUnit:"g",price:0,usedQty:0,usedUnit:"g"});renderRows();const inputs=$("ingredientRows").querySelectorAll(".name-input");inputs[inputs.length-1]?.focus();});
$("addCategoryBtn").addEventListener("click",()=>{rows.push({type:"category",name:"New section"});renderRows();});
$("resetBtn").addEventListener("click",()=>{if(!confirm("Reset all costing data to the Graham Nest sample?"))return;rows=structuredClone(sampleRows);$("recipeName").value="Graham Nest";$("yield").value=22;$("sellingPrice").value=10;$("currency").value="₱";$("includeOverhead").checked=false;$("overhead").value=0;$("overhead").disabled=true;renderRows();});
$("saveBtn").addEventListener("click",()=>{$("saveStatus").textContent="Costing saved in this browser at "+new Date().toLocaleTimeString();saveLocal();});
$("exportBtn").addEventListener("click",()=>{
 const data=[["Section","Ingredient / supply","Package amount","Package unit","Package price","Amount used","Used unit","Unit cost","Total cost"]];
 rows.forEach(r=>{if(r.type==="category"){data.push([r.name]);return;}const c=calcRow(r);data.push([r.category,r.name,r.packageQty,r.packageUnit,r.price,r.usedQty,r.usedUnit,c.unit.toFixed(4),c.cost.toFixed(2)]);});
 data.push([],["Batch details","Value"],["Recipe", $("recipeName").value],["Yield", $("yield").value],["Selling price", $("sellingPrice").value],["Currency", $("currency").value]);
 const csv=data.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="graham-nest-costing.csv";a.click();URL.revokeObjectURL(url);
});
renderRows();
