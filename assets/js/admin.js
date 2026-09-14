// ============================================================
// admin.js — Halaman Admin (/admin) — tampilan disamakan 100%
// dengan dashboard Rekap Penjualan (penjualan.js): Tailwind CDN,
// palet stone/red, font Plus Jakarta Sans + JetBrains Mono,
// ikon Lucide, dan pola render satu halaman (single-render app).
// Hanya ada satu mode tampilan (terang) — tidak ada toggle tema.
// ============================================================

const STORAGE_KEYS = {
  PRODUCTS: 'ccl_products',
  ACCOUNTS: 'ccl_accounts',
  SESSION: 'ccl_session',
};

const DEFAULT_PRODUCTS = [
  {
    id: "p1",
    name: "Custom Design T-Shirt",
    desc: "Cotton Combed Premium Custom Design",
    subDesc: "Cotton combed berkualitas dengan sablon tajam & lembut.",
    img: "assets/gambar/t-shirt.png",
    price: 0,
  },
  {
    id: "p2",
    name: "Custom Design Hoodie",
    desc: "Fleece Premium Custom Design",
    subDesc: "Bahan tebal hangat dengan hasil print detail & awet.",
    img: "assets/gambar/hoodie.png",
    price: 0,
  },
  {
    id: "p3",
    name: "Custom Design Flag",
    desc: "Bahan Kain Satin/Satinet Custom Design",
    subDesc: "Bendera komunitas / event dengan warna tajam anti pudar.",
    img: "assets/gambar/flag.png",
    price: 0,
  },
  {
    id: "p4",
    name: "Custom Design Sticker",
    desc: "Stiker Vinyl Waterproof Custom Design",
    subDesc: "Vinyl waterproof, die-cut/kiss-cut siap tempel.",
    img: "assets/gambar/sticker.png",
    price: 0,
  },
  {
    id: "p5",
    name: "Custom Design Tote Bag",
    desc: "Kanvas Premium Custom Design",
    subDesc: "Kanvas tebal kuat untuk kebutuhan harian & hobi.",
    img: "assets/gambar/totebag.png",
    price: 0,
  },
  {
    id: "p6",
    name: "Custom Design Jersey",
    desc: "Dryfit Sublimation Custom Design",
    subDesc: "Sublimasi full print untuk tim olahraga atau esport.",
    img: "assets/gambar/jersey.png",
    price: 0,
  },
  {
    id: "p7",
    name: "Custom Design Lainnya",
    desc: "Request Khusus Custom Design Customer",
    subDesc: "Punya ide unik lain? Konsultasikan langsung dengan kami.",
    img: "assets/gambar/lainyya.png",
    price: 0,
  },
];

const DEFAULT_ACCOUNTS = [{ username: "admin", pass: "123", role: "Owner" }];

function getStoredProducts() {
  const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }

  let products = JSON.parse(stored);

  let needsMigration = false;
  products = products.map((p) => {
    if (typeof p.price === "undefined") {
      needsMigration = true;
      return { ...p, price: 0 };
    }
    return p;
  });

  if (needsMigration) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  return products;
}

function saveStoredProducts(products) {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

function getStoredAccounts() {
  const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  }
  return JSON.parse(stored);
}

function saveStoredAccounts(accounts) {
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}

// ============================================================
// AppState — satu sumber kebenaran untuk seluruh tampilan.
// Setiap perubahan penting memanggil AppState.render() yang akan
// menulis ulang #app, persis seperti pola di penjualan.js.
// ============================================================
const AppState = {
  activeTab: 'products', // 'products' | 'accounts'
  mobileMenuOpen: false,
  toastMessage: null,
  productDraft: { id: '', name: '', desc: '', subDesc: '', img: '' },
  accountDraft: { username: '', pass: '' },

  getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEYS.SESSION) || 'null');
    } catch (e) {
      return null;
    }
  },

  setSession(session) {
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  },

  clearSession() {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  showToast(message) {
    this.toastMessage = message;
    this.render();
    setTimeout(() => {
      this.toastMessage = null;
      this.render();
    }, 3000);
  },

  render() {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    const session = this.getSession();

    if (!session) {
      appContainer.innerHTML = renderLoginScreen();
    } else {
      appContainer.innerHTML = renderDashboardScreen(session);
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
};

// ============================================================
// LOGIN
// ============================================================
function renderLoginScreen() {
  return `
    <div class="min-h-screen bg-stone-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div class="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-stone-200 z-10 space-y-6 animate-fade-in">
        <div class="text-center space-y-3">
          <div class="w-14 h-14 bg-red-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-red-600/30 ring-4 ring-red-50">
            <i data-lucide="layers" class="w-7 h-7"></i>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-stone-900 tracking-tight">Corat Coret Layar</h1>
            <p class="text-xs text-stone-500 mt-1 font-medium">Panel Admin &middot; Produk &amp; Akun</p>
          </div>
        </div>

        <form onsubmit="handleAdminLoginSubmit(event)" class="space-y-4">
          <div id="login-error" class="hidden p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center space-x-2.5">
            <i data-lucide="alert-circle" class="w-4 h-4 shrink-0 text-rose-600"></i>
            <span id="login-error-text">Username atau Password salah!</span>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-stone-700">Username Akun</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                <i data-lucide="user" class="w-4 h-4"></i>
              </span>
              <input
                type="text"
                id="input-username"
                placeholder="Masukkan username"
                required
                autocomplete="username"
                class="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 text-stone-800 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none transition placeholder:text-stone-400"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-stone-700">Password</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400">
                <i data-lucide="lock" class="w-4 h-4"></i>
              </span>
              <input
                type="password"
                id="input-password"
                placeholder="Masukkan password"
                required
                autocomplete="current-password"
                class="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 text-stone-800 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none transition placeholder:text-stone-400"
              />
            </div>
          </div>

          <button
            type="submit"
            class="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/20 transition active:scale-[0.99] flex items-center justify-center space-x-2 mt-2"
          >
            <span>Masuk Dashboard</span>
          </button>
        </form>

        <div class="pt-4 border-t border-stone-100 flex flex-col items-center">
          <a
            href="index.html"
            class="w-full py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-red-700 font-semibold rounded-xl text-xs transition border border-stone-200 flex items-center justify-center space-x-2 group"
          >
            <i data-lucide="arrow-left" class="w-4 h-4 text-stone-400 group-hover:text-red-600 transition-transform group-hover:-transtone-x-0.5"></i>
            <span>Kembali ke Website Utama</span>
          </a>
        </div>
      </div>
    </div>
  `;
}

function handleAdminLoginSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('input-username').value.trim();
  const password = document.getElementById('input-password').value.trim();

  const accounts = getStoredAccounts();
  const match = accounts.find((a) => a.username === username && a.pass === password);

  if (match) {
    AppState.setSession(match);
    AppState.activeTab = 'products';
    AppState.render();
  } else {
    const errBox = document.getElementById('login-error');
    if (errBox) errBox.classList.remove('hidden');
  }
}

function handleAdminLogout() {
  AppState.clearSession();
  AppState.render();
}

// ============================================================
// DASHBOARD SHELL (sidebar + header) — sama persis dengan pola
// renderDashboardScreen() di penjualan.js
// ============================================================
function renderDashboardScreen(session) {
  return `
    <div class="flex-1 flex flex-col md:flex-row min-h-screen bg-stone-50 text-stone-800">
      <!-- Sidebar Navigation -->
      <aside class="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-stone-200/90 flex flex-col justify-between shrink-0 shadow-xs z-30">
        <div>
          <div class="p-5 border-b border-stone-100 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-9 h-9 bg-red-600 text-white rounded-xl flex items-center justify-center font-bold shadow-md shadow-red-600/20 shrink-0">
                <i data-lucide="layers" class="w-5 h-5"></i>
              </div>
              <div>
                <h1 class="font-extrabold text-stone-900 text-sm tracking-tight">Corat Coret Layar</h1>
                <p class="text-[10px] text-stone-500 font-medium">Panel Admin</p>
              </div>
            </div>

            <button
              onclick="AppState.mobileMenuOpen = !AppState.mobileMenuOpen; AppState.render();"
              class="md:hidden p-2 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100"
            >
              <i data-lucide="${AppState.mobileMenuOpen ? 'x' : 'menu'}" class="w-5 h-5"></i>
            </button>
          </div>

          <nav class="${AppState.mobileMenuOpen ? 'block' : 'hidden'} md:block p-3 space-y-1 text-xs font-semibold">
            <button
              onclick="switchAdminTab('products')"
              class="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition ${AppState.activeTab === 'products' ? 'bg-red-600 text-white shadow-md shadow-red-600/20' : 'hover:bg-stone-100 text-stone-600 hover:text-stone-900'}"
            >
              <i data-lucide="box" class="w-4 h-4"></i>
              <span>Kelola Foto &amp; Produk</span>
              <span class="ml-auto ${AppState.activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600 border border-stone-200'} text-[10px] px-2 py-0.5 rounded-md font-mono">${getStoredProducts().length}</span>
            </button>

            <button
              onclick="switchAdminTab('accounts')"
              class="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition ${AppState.activeTab === 'accounts' ? 'bg-red-600 text-white shadow-md shadow-red-600/20' : 'hover:bg-stone-100 text-stone-600 hover:text-stone-900'}"
            >
              <i data-lucide="users" class="w-4 h-4"></i>
              <span>Kelola Akun Admin</span>
            </button>

            <a
              href="index.html"
              class="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition text-stone-500 hover:text-red-700 hover:bg-red-50 mt-4 border border-dashed border-stone-200"
            >
              <i data-lucide="globe" class="w-4 h-4"></i>
              <span>Ke Website Utama</span>
              <i data-lucide="external-link" class="w-3 h-3 ml-auto text-stone-400"></i>
            </a>
          </nav>
        </div>

        <div class="${AppState.mobileMenuOpen ? 'block' : 'hidden'} md:block p-4 border-t border-stone-100 bg-stone-50/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2.5 overflow-hidden">
              <div class="w-8 h-8 rounded-xl bg-red-100 text-red-800 font-bold flex items-center justify-center shrink-0 border border-red-200 text-xs">
                ${session.username.charAt(0).toUpperCase()}
              </div>
              <div class="truncate">
                <p class="text-xs font-bold text-stone-900 truncate">${session.username}</p>
                <p class="text-[10px] text-stone-500 capitalize">${session.role}</p>
              </div>
            </div>

            <button
              onclick="handleAdminLogout()"
              title="Keluar Sesi"
              class="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <i data-lucide="log-out" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col bg-stone-50 overflow-y-auto">
        <header class="bg-white border-b border-stone-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          <div>
            <h2 class="text-base font-bold text-stone-900 capitalize flex items-center space-x-2">
              <span>${getTabTitle(AppState.activeTab)}</span>
            </h2>
            <div class="flex items-center space-x-2 mt-0.5">
              <span class="inline-flex items-center text-[11px] text-stone-500">
                Masuk sebagai ${session.username}
              </span>
              <span class="text-stone-300">&bull;</span>
              <span class="inline-flex items-center text-[11px] font-medium text-red-700">
                <span class="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
                Tersimpan Lokal di Perangkat
              </span>
            </div>
          </div>
        </header>

        ${AppState.toastMessage ? `
          <div class="mx-6 mt-4 p-3.5 bg-red-600 text-white rounded-xl text-xs shadow-lg flex items-center justify-between animate-fade-in">
            <div class="flex items-center space-x-2.5">
              <i data-lucide="check-circle-2" class="w-4 h-4 shrink-0"></i>
              <span class="font-medium">${AppState.toastMessage}</span>
            </div>
          </div>
        ` : ''}

        <div class="p-6 flex-1 space-y-6">
          ${renderActiveTabContent()}
        </div>
      </main>
    </div>
  `;
}

function getTabTitle(tab) {
  switch (tab) {
    case 'accounts': return 'Kelola Akun Admin';
    case 'products':
    default: return 'Kelola Foto & Produk';
  }
}

function switchAdminTab(tab) {
  AppState.activeTab = tab;
  AppState.mobileMenuOpen = false;
  AppState.render();
}

function renderActiveTabContent() {
  switch (AppState.activeTab) {
    case 'accounts':
      return renderAccountsTab();
    case 'products':
    default:
      return renderProductsTab();
  }
}

// ============================================================
// TAB: PRODUK
// ============================================================
function renderProductsTab() {
  const products = getStoredProducts();
  const draft = AppState.productDraft;
  const isEditing = !!draft.id;

  return `
    <div class="space-y-6 animate-fade-in">
      <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <h3 class="font-bold text-stone-900 text-sm mb-4">${isEditing ? 'Edit Produk: ' + escapeHtml(draft.name) : 'Tambah / Edit Produk Baru'}</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-stone-700">Nama Produk</label>
            <input
              type="text"
              id="pName"
              value="${escapeAttr(draft.name)}"
              oninput="AppState.productDraft.name = this.value"
              placeholder="cth: Custom Design Hoodie"
              required
              class="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 text-stone-800 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none transition placeholder:text-stone-400"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-stone-700">Bahan / Kategori Material</label>
            <input
              type="text"
              id="pDesc"
              value="${escapeAttr(draft.desc)}"
              oninput="AppState.productDraft.desc = this.value"
              placeholder="cth: Fleece Premium Custom Design"
              required
              class="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 text-stone-800 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none transition placeholder:text-stone-400"
            />
          </div>
        </div>

        <div class="space-y-1.5 mt-4">
          <label class="text-xs font-semibold text-stone-700">Deskripsi Singkat</label>
          <input
            type="text"
            id="pSubDesc"
            value="${escapeAttr(draft.subDesc)}"
            oninput="AppState.productDraft.subDesc = this.value"
            placeholder="cth: Bahan tebal hangat dengan hasil print detail & awet."
            required
            class="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 text-stone-800 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none transition placeholder:text-stone-400"
          />
        </div>

        <div class="space-y-1.5 mt-4">
          <label class="text-xs font-semibold text-stone-700">Foto Produk (URL Gambar atau Upload)</label>
          <div class="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              type="text"
              id="pImgUrl"
              value="${escapeAttr(draft.img)}"
              oninput="AppState.productDraft.img = this.value"
              placeholder="https://... atau upload foto"
              class="flex-1 min-w-[180px] px-3.5 py-2.5 bg-stone-50 border border-stone-200 text-stone-800 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none transition placeholder:text-stone-400"
            />
            <input type="file" id="pImgFile" accept="image/*" style="display:none" onchange="handleImageUpload(event)" />
            <button
              type="button"
              onclick="document.getElementById('pImgFile').click()"
              class="px-3.5 py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition border border-stone-200 whitespace-nowrap shrink-0"
            >
              <i data-lucide="upload" class="w-3.5 h-3.5"></i>
              <span>Upload Foto</span>
            </button>
          </div>
          ${draft.img ? `
            <div class="pt-2">
              <img src="${escapeAttr(draft.img)}" onerror="this.src='https://placehold.co/100x100/e7e5e4/78716c?text=IMG'" class="w-16 h-16 rounded-xl object-cover border border-stone-200" />
            </div>
          ` : ''}
        </div>

        <div class="flex flex-wrap gap-2 mt-5 pt-4 border-t border-stone-100">
          <button
            type="button"
            onclick="saveProduct()"
            class="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-md shadow-red-600/20 active:scale-95"
          >
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>Simpan Produk</span>
          </button>
          <button
            type="button"
            onclick="resetProductForm()"
            class="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition"
          >
            Batal / Clear
          </button>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div class="px-5 py-4 border-b border-stone-100">
          <h3 class="font-bold text-stone-900 text-sm">Daftar Produk Aktif</h3>
          <p class="text-xs text-stone-500">Produk yang tampil di halaman utama website</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th class="py-3.5 px-4">Foto</th>
                <th class="py-3.5 px-4">Nama Produk</th>
                <th class="py-3.5 px-4">Deskripsi Material</th>
                <th class="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              ${products.length === 0 ? `
                <tr>
                  <td colspan="4" class="py-12 text-center text-stone-400">
                    <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-stone-300"></i>
                    Belum ada produk yang ditambahkan.
                  </td>
                </tr>
              ` : products.map(p => `
                <tr class="hover:bg-stone-50 transition">
                  <td class="py-3 px-4">
                    <img src="${escapeAttr(p.img)}" onerror="this.src='https://placehold.co/100x100/e7e5e4/78716c?text=IMG'" class="w-11 h-11 rounded-lg object-cover border border-stone-200" />
                  </td>
                  <td class="py-3 px-4 font-bold text-stone-900">${escapeHtml(p.name)}</td>
                  <td class="py-3 px-4 text-stone-500">${escapeHtml(p.desc)}</td>
                  <td class="py-3 px-4">
                    <div class="flex items-center justify-center space-x-1.5">
                      <button
                        onclick="editProduct('${p.id}')"
                        title="Edit Produk"
                        class="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <i data-lucide="pen" class="w-4 h-4"></i>
                      </button>
                      <button
                        onclick="deleteProduct('${p.id}')"
                        title="Hapus Produk"
                        class="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    AppState.productDraft.img = evt.target.result;
    AppState.render();
  };
  reader.readAsDataURL(file);
}

function saveProduct() {
  const draft = AppState.productDraft;
  const name = (draft.name || '').trim();
  const desc = (draft.desc || '').trim();
  const subDesc = (draft.subDesc || '').trim();
  let img = (draft.img || '').trim();

  if (!name || !desc) {
    alert('Mohon isi nama produk dan deskripsi bahan!');
    return;
  }

  if (!img) {
    img = 'https://placehold.co/400x300/e7e5e4/78716c?text=' + encodeURIComponent(name);
  }

  let products = getStoredProducts();

  if (draft.id) {
    products = products.map((p) => p.id === draft.id ? { ...p, name, desc, subDesc, img } : p);
  } else {
    const newId = 'p_' + Date.now();
    products.push({ id: newId, name, desc, subDesc, img, price: 0 });
  }

  saveStoredProducts(products);
  AppState.productDraft = { id: '', name: '', desc: '', subDesc: '', img: '' };
  AppState.showToast(`Produk "${name}" berhasil disimpan!`);
}

function editProduct(id) {
  const products = getStoredProducts();
  const target = products.find((p) => p.id === id);
  if (!target) return;

  AppState.productDraft = {
    id: target.id,
    name: target.name,
    desc: target.desc,
    subDesc: target.subDesc || '',
    img: target.img,
  };
  AppState.render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteProduct(id) {
  if (!confirm('Apakah kamu yakin ingin menghapus produk ini?')) return;
  let products = getStoredProducts();
  products = products.filter((p) => p.id !== id);
  saveStoredProducts(products);
  AppState.showToast('Produk berhasil dihapus.');
}

function resetProductForm() {
  AppState.productDraft = { id: '', name: '', desc: '', subDesc: '', img: '' };
  AppState.render();
}

// ============================================================
// TAB: AKUN ADMIN
// ============================================================
function renderAccountsTab() {
  const accounts = getStoredAccounts();
  const draft = AppState.accountDraft;

  return `
    <div class="space-y-6 animate-fade-in">
      <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <h3 class="font-bold text-stone-900 text-sm mb-1">Buatkan Akun Admin Baru</h3>
        <p class="text-xs text-stone-500 mb-4">Buat akun baru agar staf/admin bisa login ke dashboard ini</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-stone-700">Username Admin Baru</label>
            <input
              type="text"
              id="newAdminUser"
              value="${escapeAttr(draft.username)}"
              oninput="AppState.accountDraft.username = this.value"
              placeholder="cth: admin2"
              class="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 text-stone-800 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none transition placeholder:text-stone-400"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-stone-700">Password</label>
            <input
              type="password"
              id="newAdminPass"
              value="${escapeAttr(draft.pass)}"
              oninput="AppState.accountDraft.pass = this.value"
              placeholder="Masukkan password"
              class="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 text-stone-800 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none transition placeholder:text-stone-400"
            />
          </div>
        </div>

        <button
          type="button"
          onclick="createNewAdminAccount()"
          class="mt-4 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-md shadow-red-600/20 active:scale-95"
        >
          <i data-lucide="user-plus" class="w-4 h-4"></i>
          <span>Buat Akun Admin</span>
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div class="px-5 py-4 border-b border-stone-100">
          <h3 class="font-bold text-stone-900 text-sm">Daftar Akun Terdaftar</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th class="py-3.5 px-4">Username</th>
                <th class="py-3.5 px-4">Role</th>
                <th class="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              ${accounts.map(a => `
                <tr class="hover:bg-stone-50 transition">
                  <td class="py-3 px-4 font-bold text-stone-900 font-mono">${escapeHtml(a.username)}</td>
                  <td class="py-3 px-4">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${a.role === 'Owner' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-red-100 text-red-800 border border-red-200'}">
                      ${escapeHtml(a.role)}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    ${a.username !== 'admin' ? `
                      <button
                        onclick="deleteAdminAccount('${a.username}')"
                        title="Hapus Akun"
                        class="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <i data-lucide="user-minus" class="w-4 h-4"></i>
                      </button>
                    ` : `<span class="text-[10px] text-stone-400 italic">Utama</span>`}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function createNewAdminAccount() {
  const draft = AppState.accountDraft;
  const u = (draft.username || '').trim();
  const p = (draft.pass || '').trim();

  if (!u || !p) {
    alert('Isi username dan password untuk akun admin baru!');
    return;
  }

  const accounts = getStoredAccounts();
  if (accounts.some((a) => a.username === u)) {
    alert('Username ini sudah ada!');
    return;
  }

  accounts.push({ username: u, pass: p, role: 'Admin' });
  saveStoredAccounts(accounts);

  AppState.accountDraft = { username: '', pass: '' };
  AppState.showToast(`Akun admin "${u}" berhasil dibuat!`);
}

function deleteAdminAccount(username) {
  if (username === 'admin') {
    alert('Akun Owner utama tidak dapat dihapus!');
    return;
  }
  if (!confirm(`Hapus akun admin "${username}"?`)) return;

  let accounts = getStoredAccounts();
  accounts = accounts.filter((a) => a.username !== username);
  saveStoredAccounts(accounts);
  AppState.showToast(`Akun "${username}" telah dihapus.`);
}

// ============================================================
// Util kecil untuk escaping teks/atribut sebelum ditulis ke innerHTML
// ============================================================
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ============================================================
// Boot
// ============================================================
AppState.render();
