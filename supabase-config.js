// Moi Finanzas — configuración pública de Supabase.
// La publishable key es pública por diseño. Nunca poner aquí service_role ni secret keys.
const MOI_SUPABASE_PUBLIC_KEY = ["sb_publishable_", "DHXl-sFflvHKdaLgVMrnPA_5Bh4s2pS"].join("");
window.MOI_SUPABASE = {
  url: "https://oxqafuddbkzdqnqlgfyd.supabase.co",
  anonKey: MOI_SUPABASE_PUBLIC_KEY
};

// Módulo opcional de asistentes para presupuestos.
if(!document.querySelector('script[data-moi-work-assistants]')){
  const assistantScript=document.createElement('script');
  assistantScript.src='./work-assistants.js';
  assistantScript.defer=true;
  assistantScript.dataset.moiWorkAssistants='1';
  document.head.appendChild(assistantScript);
}
