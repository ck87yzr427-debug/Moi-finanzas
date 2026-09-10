(() => {
  "use strict";

  const VERSION = "1.0.0";
  const RETRY_MS = 120;
  const MAX_RETRIES = 120;

  function money(n){
    try{return new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(Number(n||0));}
    catch(e){return `${Number(n||0).toFixed(2)} €`;}
  }
  function num(v, fallback=0){
    const n=Number(v);
    return Number.isFinite(n)?n:fallback;
  }
  function roundUp(value, step=1){
    if(value<=0)return 0;
    return Math.ceil(value/step)*step;
  }
  function esc(s){
    return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  }
  function field(id,label,type="number",attrs=""){
    return `<div><label for="${id}">${label}</label><input id="${id}" type="${type}" ${attrs}></div>`;
  }
  function setVal(id,value){const el=document.getElementById(id);if(el)el.value=value;}
  function getVal(id){return document.getElementById(id)?.value??"";}
  function checked(id){return !!document.getElementById(id)?.checked;}

  function waitForBudget(retries=0){
    const ready = window.budgetForm && window.addBudgetItem && typeof window.addBudgetItem.onclick === "function" && window.budgetItems;
    if(ready){init();return;}
    if(retries<MAX_RETRIES)setTimeout(()=>waitForBudget(retries+1),RETRY_MS);
  }

  function injectStyles(){
    if(document.getElementById("moiWorkAssistantStyles"))return;
    const style=document.createElement("style");
    style.id="moiWorkAssistantStyles";
    style.textContent=`
      .wa-shell{margin-top:14px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:0 14px}
      .wa-shell>summary{cursor:pointer;list-style:none;padding:14px 0;font-weight:800;display:flex;justify-content:space-between;align-items:center;gap:10px}
      .wa-shell>summary::-webkit-details-marker{display:none}.wa-shell>summary::after{content:"⌄";font-size:18px;color:var(--muted)}.wa-shell[open]>summary::after{content:"⌃"}
      .wa-body{padding:0 0 14px}.wa-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:12px 0}.wa-tab{background:#eef0f3;color:#111;padding:10px 8px}.wa-tab.active{background:#111;color:#fff}
      .wa-panel{display:none}.wa-panel.active{display:block}.wa-box{background:#f8fafc;border:1px solid var(--line);border-radius:14px;padding:12px;margin-top:10px}.wa-result{margin-top:12px}.wa-result-row{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:8px 0;border-bottom:1px solid var(--line)}.wa-result-row:last-child{border-bottom:0}.wa-result-row strong{text-align:right}.wa-note{font-size:12px;color:var(--muted);line-height:1.4;margin-top:8px}.wa-warning{font-size:12px;color:#8a4b08;background:#fff7e6;border:1px solid #f3d19c;border-radius:12px;padding:10px;margin-top:10px}.wa-ok{font-size:12px;color:var(--good);background:#edf8f1;border:1px solid #cdebd8;border-radius:12px;padding:10px;margin-top:10px}.wa-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.wa-dim{margin-top:10px;border-top:1px solid var(--line);padding-top:8px}.wa-dim summary{cursor:pointer;font-weight:650;font-size:13px}.wa-chip{display:inline-block;padding:4px 7px;border-radius:999px;background:#eef0f3;font-size:11px;margin:2px 4px 2px 0}.wa-source{font-size:11px;color:var(--muted);margin-top:10px}.wa-source a{color:inherit}
      @media(max-width:760px){.wa-tabs{grid-template-columns:1fr}.wa-result-row{font-size:14px}}
    `;
    document.head.appendChild(style);
  }

  function assistantMarkup(){
    return `
      <details class="wa-shell" id="workAssistant">
        <summary>🧰 Asistente de trabajo <span class="muted" style="font-weight:500">opcional</span></summary>
        <div class="wa-body">
          <div class="muted">Calcula necesidades aproximadas y añádelas al presupuesto. Tú puedes revisar y cambiar cualquier cantidad antes de guardar.</div>
          <div class="wa-tabs">
            <button type="button" class="wa-tab active" data-wa="paint">🎨 Pintura</button>
            <button type="button" class="wa-tab" data-wa="electric">⚡ Electricidad</button>
            <button type="button" class="wa-tab" data-wa="drywall">🧱 Pladur</button>
          </div>

          <section class="wa-panel active" data-wa-panel="paint">
            <div class="row2">
              ${field("waPaintArea","Superficie total a pintar (m²)","number",'min="0" step="0.1" placeholder="Ej. 32"')}
              <div><label for="waPaintCoats">Nº de manos</label><select id="waPaintCoats"><option>1</option><option selected>2</option><option>3</option></select></div>
            </div>
            <div class="row2">
              ${field("waPaintCoverage","Rendimiento pintura (m²/L por mano)","number",'min="1" step="0.5" value="10"')}
              <div><label for="waPaintCondition">Estado de la superficie</label><select id="waPaintCondition"><option value="good">Buena</option><option value="light" selected>Pequeños desperfectos</option><option value="medium">Bastante resane</option><option value="poor">Muy deteriorada / soporte nuevo</option></select></div>
            </div>
            <div class="row2">
              ${field("waPaintFloor","Suelo a proteger (m²)","number",'min="0" step="0.1" placeholder="Opcional"')}
              ${field("waPaintCover","Muebles / zonas a cubrir (m²)","number",'min="0" step="0.1" placeholder="Opcional"')}
            </div>
            <label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input id="waPaintBasics" type="checkbox" checked style="width:auto"> Añadir consumibles básicos (rodillo y brocha)</label>

            <details class="wa-dim">
              <summary>No sé los m² → calcular por medidas</summary>
              <div class="row3">
                ${field("waPaintWidth","Ancho (m)","number",'min="0" step="0.01" placeholder="4.7"')}
                ${field("waPaintHeight","Alto (m)","number",'min="0" step="0.01" placeholder="2.4"')}
                ${field("waPaintCount","Nº superficies","number",'min="1" step="1" value="1"')}
              </div>
              <div class="row2">
                ${field("waPaintOpenings","Puertas/ventanas a descontar (m²)","number",'min="0" step="0.1" value="0"')}
                ${field("waPaintExtraArea","Techo u otra superficie extra (m²)","number",'min="0" step="0.1" value="0"')}
              </div>
              <button type="button" class="secondary" id="waUsePaintDimensions" style="margin-top:8px">Usar estos m²</button>
            </details>
            <div class="wa-actions"><button type="button" id="waCalcPaint">Calcular materiales</button></div>
            <div id="waPaintResult" class="wa-result"></div>
          </section>

          <section class="wa-panel" data-wa-panel="electric">
            <div class="wa-warning">Ayuda orientativa para vivienda. La sección final depende también del método de instalación, temperatura, agrupamiento, longitud y fabricante. Verifica REBT y condiciones reales antes de ejecutar.</div>
            <div class="row2">
              <div><label for="waElecCircuit">Circuito / aparato</label><select id="waElecCircuit">
                <option value="C1">Iluminación (C1)</option><option value="C2">Tomas uso general (C2)</option><option value="C3">Cocina / horno (C3)</option><option value="C4">Lavadora / lavavajillas / termo (C4)</option><option value="C5">Tomas baño / auxiliares cocina (C5)</option><option value="C8">Calefacción eléctrica (C8)</option><option value="C9">Aire acondicionado (C9)</option><option value="C10">Secadora (C10)</option><option value="C11">Automatización (C11)</option>
              </select></div>
              ${field("waElecDistance","Longitud cuadro → punto (m)","number",'min="0" step="0.1" placeholder="Ej. 18"')}
            </div>
            <div class="row2">
              ${field("waElecPower","Potencia del receptor (W)","number",'min="0" step="1" placeholder="Opcional"')}
              <div><label for="waElecFormat">Cableado</label><select id="waElecFormat"><option value="individual">Conductores individuales L/N/PE</option><option value="3g">Cable 3G</option></select></div>
            </div>
            <div class="wa-actions"><button type="button" id="waCalcElectric">Obtener referencia</button></div>
            <div id="waElectricResult" class="wa-result"></div>
            <div class="wa-source">Referencia normativa: REBT ITC-BT-25 e ITC-BT-19 (BOE).</div>
          </section>

          <section class="wa-panel" data-wa-panel="drywall">
            <div class="row2">
              ${field("waDryArea","Superficie (m²)","number",'min="0" step="0.1" placeholder="Ej. 18"')}
              <div><label for="waDrySides">Caras a revestir</label><select id="waDrySides"><option value="1">1 cara</option><option value="2">2 caras</option></select></div>
            </div>
            <div class="row2">
              <div><label for="waDryLayers">Capas de placa por cara</label><select id="waDryLayers"><option value="1">1 capa</option><option value="2">2 capas</option></select></div>
              ${field("waDryPerimeter","Perímetro / canales (m)","number",'min="0" step="0.1" placeholder="Opcional"')}
            </div>
            <label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input id="waDryInsulation" type="checkbox" style="width:auto"> Incluir aislamiento interior</label>
            <div class="wa-actions"><button type="button" id="waCalcDrywall">Calcular materiales</button></div>
            <div id="waDrywallResult" class="wa-result"></div>
            <div class="wa-note">Estimación inicial con 10% de merma. Confirma modulación, tipo y medida de placa según el sistema real.</div>
          </section>
        </div>
      </details>`;
  }

  const results={paint:[],electric:[],drywall:[]};

  function renderMaterials(targetId, materials, summaryHtml="", note=""){
    const target=document.getElementById(targetId);
    if(!target)return;
    const key=targetId.includes("Paint")?"paint":targetId.includes("Electric")?"electric":"drywall";
    results[key]=materials;
    const rows=materials.map(m=>`<div class="wa-result-row"><span>${esc(m.name)}<div class="muted">${esc(m.reason||"")}</div></span><strong>${Number(m.qty||0).toLocaleString("es-ES",{maximumFractionDigits:2})} ${esc(m.unit||"unidad")}</strong></div>`).join("");
    target.innerHTML=`${summaryHtml?`<div class="wa-box">${summaryHtml}</div>`:""}${materials.length?`<div class="wa-box">${rows}</div><div class="wa-actions"><button type="button" data-wa-add="${key}">+ Añadir al presupuesto</button></div>`:""}${note?`<div class="wa-note">${note}</div>`:""}`;
  }

  function calcPaint(){
    const area=num(getVal("waPaintArea"));
    const coats=Math.max(1,num(getVal("waPaintCoats"),2));
    const coverage=Math.max(1,num(getVal("waPaintCoverage"),10));
    const condition=getVal("waPaintCondition")||"light";
    const floor=num(getVal("waPaintFloor"));
    const cover=num(getVal("waPaintCover"));
    if(area<=0){alert("Introduce los m² que vas a pintar.");return;}

    const waste=1.10;
    const paintL=roundUp((area*coats/coverage)*waste,0.5);
    const puttyRate={good:0,light:0.03,medium:0.08,poor:0.18}[condition]||0;
    const puttyKg=puttyRate?roundUp(area*puttyRate,0.5):0;
    const sandDiv={good:0,light:12,medium:8,poor:5}[condition]||0;
    const sandpaper=sandDiv?Math.max(2,Math.ceil(area/sandDiv)):0;
    const tape=Math.max(1,Math.ceil(area/30));
    const rollers=checked("waPaintBasics")?Math.max(1,Math.ceil(area/65)):0;
    const primerL=condition==="poor"?roundUp((area/10)*waste,0.5):0;

    const materials=[
      {name:"Pintura",qty:paintL,unit:"litro",reason:`${area.toFixed(1)} m² · ${coats} mano(s) · rendimiento ${coverage} m²/L + 10% margen`},
      ...(primerL?[{name:"Imprimación / selladora",qty:primerL,unit:"litro",reason:"Recomendada por soporte muy deteriorado o nuevo"}]:[]),
      ...(puttyKg?[{name:"Masilla de reparación",qty:puttyKg,unit:"kg",reason:"Estimación según estado de la superficie"}]:[]),
      ...(sandpaper?[{name:"Lijas",qty:sandpaper,unit:"unidad",reason:"Estimación para preparación y repaso"}]:[]),
      {name:"Cinta de carrocero",qty:tape,unit:"unidad",reason:"Rollos aproximados según superficie"},
      ...(floor>0?[{name:"Papel / cartón protector de suelo",qty:roundUp(floor*1.10,1),unit:"m²",reason:"Superficie de suelo + 10% de margen"}]:[]),
      ...(cover>0?[{name:"Plástico protector",qty:roundUp(cover*1.10,1),unit:"m²",reason:"Muebles y zonas a cubrir + 10% de margen"}]:[]),
      ...(rollers?[{name:"Recambio de rodillo",qty:rollers,unit:"unidad",reason:"Consumible básico"},{name:"Brocha de recorte",qty:1,unit:"unidad",reason:"Consumible básico"}]:[])
    ];
    renderMaterials("waPaintResult",materials,`<strong>${area.toFixed(1)} m²</strong> a pintar · pintura estimada <strong>${paintL.toLocaleString("es-ES")} L</strong>`,"Las cantidades son una previsión. Ajusta el rendimiento con el dato real del fabricante y revisa el estado del soporte antes de comprar.");
  }

  function usePaintDimensions(){
    const w=num(getVal("waPaintWidth")),h=num(getVal("waPaintHeight")),count=Math.max(1,num(getVal("waPaintCount"),1));
    const openings=num(getVal("waPaintOpenings")),extra=num(getVal("waPaintExtraArea"));
    const area=Math.max(0,w*h*count-openings+extra);
    if(w<=0||h<=0){alert("Introduce ancho y alto.");return;}
    setVal("waPaintArea",Math.round(area*100)/100);
  }

  const circuits={
    C1:{label:"Iluminación",breaker:10,section:1.5,conduit:16,maxPoints:30},
    C2:{label:"Tomas uso general",breaker:16,section:2.5,conduit:20,maxPoints:20},
    C3:{label:"Cocina / horno",breaker:25,section:6,conduit:25,maxPoints:2},
    C4:{label:"Lavadora / lavavajillas / termo",breaker:20,section:4,conduit:20,maxPoints:3},
    C5:{label:"Tomas baño / auxiliares cocina",breaker:16,section:2.5,conduit:20,maxPoints:6},
    C8:{label:"Calefacción eléctrica",breaker:25,section:6,conduit:25,maxPoints:null},
    C9:{label:"Aire acondicionado",breaker:25,section:6,conduit:25,maxPoints:null},
    C10:{label:"Secadora",breaker:16,section:2.5,conduit:20,maxPoints:1},
    C11:{label:"Automatización",breaker:10,section:1.5,conduit:16,maxPoints:null}
  };

  function calcVoltageDrop(distance,current,section){
    if(distance<=0||current<=0||section<=0)return null;
    const rho=0.0175;
    const dropV=(2*distance*current*rho)/section;
    return {volts:dropV,pct:dropV/230*100};
  }

  function calcElectric(){
    const code=getVal("waElecCircuit"),cfg=circuits[code];
    const distance=num(getVal("waElecDistance")),power=num(getVal("waElecPower"));
    const format=getVal("waElecFormat")||"individual";
    if(!cfg)return;
    if(distance<=0){alert("Introduce la longitud aproximada desde el cuadro hasta el punto.");return;}
    const current=power>0?power/230:0;
    const drop=calcVoltageDrop(distance,current,cfg.section);
    const cableQty=roundUp(distance*1.10*(format==="individual"?3:1),1);
    const conduitQty=roundUp(distance*1.10,1);
    const materials=[
      {name:format==="individual"?`Conductor cobre ${cfg.section} mm² (L/N/PE)`:`Cable cobre 3G${cfg.section} mm²`,qty:cableQty,unit:"m",reason:format==="individual"?"3 conductores + 10% de margen":"Longitud + 10% de margen"},
      {name:`Magnetotérmico ${cfg.breaker} A`,qty:1,unit:"unidad",reason:`Referencia del circuito ${code} en ITC-BT-25`},
      {name:`Tubo / conducto Ø ${cfg.conduit} mm`,qty:conduitQty,unit:"m",reason:"Diámetro de referencia ITC-BT-25 + 10% margen"}
    ];
    let stateHtml=`<strong>${code} · ${esc(cfg.label)}</strong><div style="margin-top:5px"><span class="wa-chip">Sección mínima ${cfg.section} mm²</span><span class="wa-chip">Magnetotérmico ${cfg.breaker} A</span><span class="wa-chip">Tubo Ø ${cfg.conduit} mm</span></div>`;
    if(power>0){
      stateHtml+=`<div class="muted" style="margin-top:7px">Carga aproximada: ${current.toFixed(1)} A a 230 V.</div>`;
      if(drop){
        stateHtml+=`<div class="${drop.pct<=3?"wa-ok":"wa-warning"}">Caída simplificada estimada: ${drop.volts.toFixed(2)} V (${drop.pct.toFixed(2)}%). ${drop.pct<=3?"Dentro del 3% de referencia para circuitos interiores de vivienda.":"Supera el 3%: no uses esta sección sin recalcular y verificar una sección mayor y las condiciones reales de instalación."}</div>`;
      }
      if(current>cfg.breaker){
        stateHtml+=`<div class="wa-warning">La potencia indicada implica una corriente superior al magnetotérmico de referencia de este circuito. Revisa el circuito seleccionado y el diseño antes de instalar.</div>`;
      }
    }
    renderMaterials("waElectricResult",materials,stateHtml,"La app muestra mínimos/referencias del REBT para vivienda, no sustituye el cálculo completo de intensidad admisible ni las instrucciones del fabricante. Trabaja siempre sin tensión y verifica la instalación antes de energizar.");
  }

  function calcDrywall(){
    const area=num(getVal("waDryArea"));
    const sides=Math.max(1,num(getVal("waDrySides"),1));
    const layers=Math.max(1,num(getVal("waDryLayers"),1));
    const perimeter=num(getVal("waDryPerimeter"));
    const insulation=checked("waDryInsulation");
    if(area<=0){alert("Introduce la superficie de pladur en m².");return;}
    const faceArea=area*sides*layers;
    const boards=Math.ceil((faceArea*1.10)/3.12);
    const studs=roundUp((area/0.60)*1.10,1);
    const screws=Math.ceil(faceArea*20*1.10);
    const tape=roundUp(faceArea*1.35*1.10,1);
    const compound=roundUp(faceArea*0.45*1.10,0.5);
    const materials=[
      {name:"Placa de yeso laminado 1200×2600",qty:boards,unit:"unidad",reason:"Cálculo por 3,12 m²/placa + 10% merma"},
      {name:"Perfil montante",qty:studs,unit:"m",reason:"Estimación inicial con modulación aproximada a 600 mm"},
      ...(perimeter>0?[{name:"Perfil canal",qty:roundUp(perimeter*1.10,1),unit:"m",reason:"Perímetro indicado + 10% margen"}]:[]),
      {name:"Tornillos para PYL",qty:screws,unit:"unidad",reason:"Estimación según superficie y capas"},
      {name:"Cinta de juntas",qty:tape,unit:"m",reason:"Estimación de juntas + margen"},
      {name:"Pasta de juntas",qty:compound,unit:"kg",reason:"Estimación para tratamiento de juntas"},
      ...(insulation?[{name:"Aislamiento interior",qty:roundUp(area*1.05,1),unit:"m²",reason:"Superficie + 5% margen"}]:[])
    ];
    renderMaterials("waDrywallResult",materials,`<strong>${area.toFixed(1)} m²</strong> · ${sides} cara(s) · ${layers} capa(s) por cara`,"Ajusta perfiles, tornillería y placa a la altura, modulación y sistema del fabricante antes de comprar.");
  }

  function existingBudgetRows(){
    return [...document.querySelectorAll("#budgetItems .budget-item")];
  }
  function setRow(row,item,addQty=false){
    const name=row.querySelector(".bi-name"),qty=row.querySelector(".bi-qty"),unit=row.querySelector(".bi-unit");
    if(name){name.value=item.name;name.dispatchEvent(new Event("input",{bubbles:true}));}
    if(qty){qty.value=addQty?(num(qty.value)+num(item.qty)):item.qty;qty.dispatchEvent(new Event("input",{bubbles:true}));}
    if(unit){
      const desired=item.unit||"unidad";
      const opt=[...unit.options].find(o=>o.value===desired||o.textContent===desired);
      unit.value=opt?opt.value:"otro";
      unit.dispatchEvent(new Event("change",{bubbles:true}));
    }
  }
  function addMaterialsToBudget(key){
    const materials=results[key]||[];
    if(!materials.length)return;
    materials.forEach(item=>{
      const rows=existingBudgetRows();
      const match=rows.find(row=>(row.querySelector(".bi-name")?.value||"").trim().toLowerCase()===item.name.trim().toLowerCase());
      if(match){
        const qty=match.querySelector(".bi-qty");
        if(qty){qty.value=num(qty.value)+num(item.qty);qty.dispatchEvent(new Event("input",{bubbles:true}));}
        return;
      }
      window.addBudgetItem.click();
      const after=existingBudgetRows();
      const row=after[after.length-1];
      if(row)setRow(row,item,false);
    });
    const costCard=window.addBudgetItem.closest(".card");
    if(costCard)costCard.scrollIntoView({behavior:"smooth",block:"center"});
  }

  function resetAssistant(){
    const root=document.getElementById("workAssistant");
    if(root)root.open=false;
    ["waPaintResult","waElectricResult","waDrywallResult"].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML="";});
    results.paint=[];results.electric=[];results.drywall=[];
  }

  function init(){
    if(document.getElementById("workAssistant"))return;
    injectStyles();
    const costCard=window.addBudgetItem.closest(".card");
    if(!costCard)return;
    costCard.insertAdjacentHTML("beforebegin",assistantMarkup());

    document.querySelectorAll(".wa-tab").forEach(btn=>btn.addEventListener("click",()=>{
      document.querySelectorAll(".wa-tab").forEach(x=>x.classList.toggle("active",x===btn));
      document.querySelectorAll(".wa-panel").forEach(p=>p.classList.toggle("active",p.dataset.waPanel===btn.dataset.wa));
    }));
    document.getElementById("waUsePaintDimensions").addEventListener("click",usePaintDimensions);
    document.getElementById("waCalcPaint").addEventListener("click",calcPaint);
    document.getElementById("waCalcElectric").addEventListener("click",calcElectric);
    document.getElementById("waCalcDrywall").addEventListener("click",calcDrywall);
    document.getElementById("workAssistant").addEventListener("click",e=>{
      const btn=e.target.closest("[data-wa-add]");
      if(btn)addMaterialsToBudget(btn.dataset.waAdd);
    });

    const observer=new MutationObserver(()=>{
      if(window.budgetDialog?.open && !window.budgetDialog.dataset.waWasOpen){
        window.budgetDialog.dataset.waWasOpen="1";
        resetAssistant();
      }else if(window.budgetDialog && !window.budgetDialog.open){
        delete window.budgetDialog.dataset.waWasOpen;
      }
    });
    observer.observe(window.budgetDialog,{attributes:true,attributeFilter:["open"]});

    window.MOI_WORK_ASSISTANTS={version:VERSION,calcPaint,calcElectric,calcDrywall};
  }

  waitForBudget();
})();
