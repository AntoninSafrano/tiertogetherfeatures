<script setup lang="ts">
import { computed, onMounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import { useAuth } from '@/composables/useAuth'
import { Copy } from 'lucide-vue-next'
import { ref } from 'vue'

const ADMIN_EMAILS = new Set(['antonin.safrano@gmail.com', 'wingsoffeed95@gmail.com'])
const { user, fetchUser } = useAuth()
const isAdmin = computed(() => !!user.value && ADMIN_EMAILS.has(user.value.email.toLowerCase()))
const copied = ref(false)

onMounted(() => { fetchUser() })

// Minified bookmarklet — runs on any TierMaker create page.
const BOOKMARKLET = `javascript:(async()=>{const cats=['Gaming','Food','Anime','Music','Movies','Sports','Other'];const cat=prompt('Cat%C3%A9gorie ? '+cats.join(' / '),'Food');if(!cats.includes(cat))return;const items=[...document.querySelectorAll('.character')].map(el=>{const m=(el.style.backgroundImage||'').match(/url\\(["']?([^"')]+)/);if(!m)return null;const fn=m[1].split('/').pop().toLowerCase();const label=fn.replace(/(jpg|jpeg|png|gif|webp)$/,'').replace(/[-_]+/g,' ').replace(/\\b\\w/g,c=>c.toUpperCase()).trim();return{id:el.id,src:m[1],label}}).filter(Boolean);if(!items.length)return alert('Aucun item trouv%C3%A9');const box=document.createElement('div');box.style.cssText='position:fixed;bottom:20px;right:20px;z-index:99999;background:%231a1a1a;color:%23fff;padding:16px;border-radius:12px;font:14px -apple-system,sans-serif;min-width:300px;border:1px solid %23a855f7';box.innerHTML='<div style=\"font-weight:600;margin-bottom:8px;\">%E2%8F%B3 Import TierTogether</div><div id=\"tt-prog\" style=\"font-size:12px;opacity:.8;\">Pr%C3%A9paration%E2%80%A6</div>';document.body.appendChild(box);const push=async u=>{const b=await(await fetch(u)).blob();const f=new FormData();f.append('file',b);f.append('upload_preset','tiertogether_preset');const j=await(await fetch('https://api.cloudinary.com/v1_1/dnbnhjbyy/image/upload',{method:'POST',body:f})).json();if(!j.secure_url)throw new Error('upload');return j.secure_url};const out=[];for(let i=0;i<items.length;i++){try{const u=await push(items[i].src);out.push({id:items[i].id,src:u,label:items[i].label})}catch(e){}document.getElementById('tt-prog').textContent='Upload '+(i+1)+'/'+items.length}let cover=document.querySelector('meta[property=\"og:image\"]')?.content||null;if(cover){try{cover=await push(cover)}catch(e){cover=null}}const p={title:(document.querySelector('h1')?.innerText||document.title).trim(),cover,category:cat,items:out};const b64=btoa(unescape(encodeURIComponent(JSON.stringify(p))));document.getElementById('tt-prog').textContent='%E2%9C%93 Redirection%E2%80%A6';setTimeout(()=>{location.href='http://tiertogether.fr/admin/import?payload='+b64},500)})();`

const SNIPPET = `(async () => {
  const cats = ['Gaming','Food','Anime','Music','Movies','Sports','Other'];
  const cat = prompt('Catégorie ? ' + cats.join(' / '), 'Food');
  if (!cats.includes(cat)) return;

  const items = [...document.querySelectorAll('.character')].map(el => {
    const m = (el.style.backgroundImage || '').match(/url\\(["']?([^"')]+)/);
    if (!m) return null;
    const fn = m[1].split('/').pop().toLowerCase();
    const label = fn.replace(/(jpg|jpeg|png|gif|webp)$/,'').replace(/[-_]+/g,' ').replace(/\\b\\w/g, c => c.toUpperCase()).trim();
    return { id: el.id, src: m[1], label };
  }).filter(Boolean);
  if (!items.length) return alert('Aucun item trouvé');

  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;background:#1a1a1a;color:#fff;padding:16px;border-radius:12px;font:14px -apple-system,sans-serif;min-width:300px;border:1px solid #a855f7';
  box.innerHTML = '<div style="font-weight:600;margin-bottom:8px;">⏳ Import TierTogether</div><div id="tt-prog" style="font-size:12px;opacity:.8;">Préparation…</div>';
  document.body.appendChild(box);

  const push = async u => {
    const b = await (await fetch(u)).blob();
    const f = new FormData();
    f.append('file', b);
    f.append('upload_preset', 'tiertogether_preset');
    const j = await (await fetch('https://api.cloudinary.com/v1_1/dnbnhjbyy/image/upload', { method:'POST', body:f })).json();
    if (!j.secure_url) throw new Error('upload');
    return j.secure_url;
  };

  const out = [];
  for (let i = 0; i < items.length; i++) {
    try {
      const u = await push(items[i].src);
      out.push({ id: items[i].id, src: u, label: items[i].label });
    } catch (e) {}
    document.getElementById('tt-prog').textContent = 'Upload ' + (i+1) + '/' + items.length;
  }

  let cover = document.querySelector('meta[property="og:image"]')?.content || null;
  if (cover) { try { cover = await push(cover); } catch (e) { cover = null; } }

  const p = {
    title: (document.querySelector('h1')?.innerText || document.title).trim(),
    cover, category: cat, items: out,
  };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(p))));
  document.getElementById('tt-prog').textContent = '✓ Redirection…';
  setTimeout(() => {
    location.href = 'http://tiertogether.fr/admin/import?payload=' + b64;
  }, 500);
})();`

async function copySnippet() {
  await navigator.clipboard.writeText(SNIPPET)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <NavBar />

    <main class="mx-auto max-w-3xl px-4 py-8 sm:px-10">
      <h1 class="text-2xl font-bold text-foreground">Import TierMaker — outils</h1>
      <p class="mt-2 text-sm text-foreground-muted">
        Cette page contient le snippet à lancer dans la console TierMaker. Il upload les images sur notre Cloudinary et te redirige ici avec un preview pour validation.
      </p>

      <div v-if="!isAdmin" class="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-6">
        <p class="text-sm font-semibold text-red-400">Accès admin requis.</p>
      </div>

      <template v-else>
        <!-- Option A : snippet à coller dans la console -->
        <section class="mt-6 rounded-xl border border-border bg-surface p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold text-foreground">Option A — Snippet console (recommandé)</h2>
              <ol class="mt-2 list-decimal pl-5 text-sm text-foreground-muted space-y-1">
                <li>Ouvre n'importe quelle tierlist sur <code class="text-primary">tiermaker.com/create/…</code></li>
                <li>F12 → onglet <b>Console</b></li>
                <li>Tape <code class="bg-surface-hover px-1">allow pasting</code> (puis Entrée)</li>
                <li>Colle le snippet ci-dessous et Entrée</li>
                <li>Choisis la catégorie dans le prompt</li>
                <li>Attends ~1 min (une boîte en bas-droite affiche le progrès)</li>
                <li>Tu es redirigé ici — clique <b>Importer</b></li>
              </ol>
            </div>
            <button
              type="button"
              class="inline-flex shrink-0 items-center gap-2 rounded-md border border-border-hover bg-surface-hover px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-active transition-colors"
              @click="copySnippet"
            >
              <Copy class="h-3.5 w-3.5" />
              {{ copied ? 'Copié !' : 'Copier' }}
            </button>
          </div>
          <pre class="mt-4 max-h-64 overflow-auto rounded-md border border-border bg-background p-3 text-[11px] leading-snug text-foreground-muted">{{ SNIPPET }}</pre>
        </section>

        <!-- Option B : bookmarklet -->
        <section class="mt-6 rounded-xl border border-border bg-surface p-5">
          <h2 class="text-base font-semibold text-foreground">Option B — Bookmarklet (1 clic)</h2>
          <p class="mt-2 text-sm text-foreground-muted">
            Fais un clic droit sur le bouton ci-dessous puis <b>"Ajouter aux favoris"</b>
            ou glisse-le dans ta barre de favoris. Ensuite, sur n'importe quelle page TierMaker,
            clique ce favori. <span class="text-foreground-subtle">(Note : Chrome récent peut bloquer le drag — passe par Option A si c'est le cas.)</span>
          </p>
          <div class="mt-4">
            <a
              :href="BOOKMARKLET"
              class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
              @click.prevent="null"
            >
              📥 Import TierMaker → TT
            </a>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>
