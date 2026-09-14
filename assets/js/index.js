      document.getElementById("year").textContent = new Date().getFullYear();

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

      function getStoredProducts() {
        const stored = localStorage.getItem("ccl_products");
        if (!stored) {
          localStorage.setItem("ccl_products", JSON.stringify(DEFAULT_PRODUCTS));
          return DEFAULT_PRODUCTS;
        }

        let products = JSON.parse(stored);

        // Migrasi data lama: kalau produk yang sudah tersimpan di browser
        // belum punya field "price" (dibuat sebelum fitur harga ada),
        // tambahkan otomatis dengan nilai 0 supaya tidak error/undefined.
        let needsMigration = false;
        products = products.map((p) => {
          if (typeof p.price === "undefined") {
            needsMigration = true;
            return { ...p, price: 0 };
          }
          return p;
        });

        if (needsMigration) {
          localStorage.setItem("ccl_products", JSON.stringify(products));
        }

        return products;
      }

      function saveStoredProducts(products) {
        localStorage.setItem("ccl_products", JSON.stringify(products));
        renderProducts();
      }

      function renderProducts() {
        const products = getStoredProducts();
        const container = document.getElementById("productGridContainer");
        container.innerHTML = "";

        products.forEach((p) => {
          const card = document.createElement("article");
          card.className = "product-card glass-box";
          card.innerHTML = `
          <div class="product-img-wrapper">
            <img src="${p.img}" alt="${p.name}" onerror="this.src='https://placehold.co/400x300/1c1917/fff?text=${encodeURIComponent(p.name)}'" />
          </div>
          <div class="product-content">
            <h3 class="product-title">${p.name}</h3>
            <p class="product-desc">${p.subDesc || p.desc}</p>
            <button class="product-btn" onclick="addToCart('${p.id}', '${p.name.replace(/'/g, "\\'")}', '${p.desc.replace(/'/g, "\\'")}', '${p.img.replace(/'/g, "\\'")}', 0, this)">
              <i class="fa-solid fa-plus"></i> Tambah ke Keranjang
            </button>
          </div>
        `;
          container.appendChild(card);
        });
      }

      renderProducts();

      // Mobile Menu Navigation Logic
      const navToggle = document.getElementById("navToggle");
      const mobileMenuDrawer = document.getElementById("mobileMenuDrawer");
      const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");
      const mobileNavItems = document.querySelectorAll(".mobile-nav-item");

      function toggleMobileMenu() {
        const isOpen = mobileMenuDrawer.classList.contains("active");
        if (isOpen) {
          mobileMenuDrawer.classList.remove("active");
          mobileMenuOverlay.classList.remove("active");
          navToggle.classList.remove("active");
        } else {
          mobileMenuDrawer.classList.add("active");
          mobileMenuOverlay.classList.add("active");
          navToggle.classList.add("active");
        }
      }

      navToggle.addEventListener("click", toggleMobileMenu);
      mobileMenuOverlay.addEventListener("click", toggleMobileMenu);
      mobileNavItems.forEach((item) => {
        item.addEventListener("click", () => {
          mobileMenuDrawer.classList.remove("active");
          mobileMenuOverlay.classList.remove("active");
          navToggle.classList.remove("active");
        });
      });

      // 3. Navbar scroll effect
      window.addEventListener("scroll", () => {
        const navbar = document.getElementById("navbar");
        if (window.scrollY > 30) {
          navbar.classList.add("scrolled");
        } else {
          navbar.classList.remove("scrolled");
        }
      });

      // 4. Typing Effect Logic
      const typingText = document.getElementById("typingText");
      const words = [
        "Custom Design T-Shirt",
        "Custom Design Hoodie",
        "Custom Design Flag",
        "Custom Design Sticker",
        "Custom Design Tote Bag",
        "Custom Design Jersey",
      ];
      let wordIndex = 0;
      let charIndex = 0;
      let isDeleting = false;

      function typeEffect() {
        const currentWord = words[wordIndex];

        if (isDeleting) {
          typingText.textContent = currentWord.substring(0, charIndex - 1);
          charIndex--;
        } else {
          typingText.textContent = currentWord.substring(0, charIndex + 1);
          charIndex++;
        }

        let speed = isDeleting ? 40 : 80;

        if (!isDeleting && charIndex === currentWord.length) {
          speed = 1800; // Pause at end of word
          isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          speed = 400;
        }

        setTimeout(typeEffect, speed);
      }

      typeEffect();

      // 5. Shopping Cart System
      let cart = [];
      const cartOverlay = document.getElementById("cartOverlay");
      const cartPanel = document.getElementById("cartPanel");
      const openCartBtn = document.getElementById("openCartBtn");
      const closeCartBtn = document.getElementById("closeCartBtn");
      const cartBadgeCount = document.getElementById("cartBadgeCount");
      const cartItemsContainer = document.getElementById("cartItemsContainer");
      const cartEmptyMsg = document.getElementById("cartEmptyMsg");
      const checkoutWaBtn = document.getElementById("checkoutWaBtn");

      function openCart() {
        cartOverlay.classList.add("active");
        cartPanel.classList.add("active");
      }

      function closeCart() {
        cartOverlay.classList.remove("active");
        cartPanel.classList.remove("active");
      }

      openCartBtn.addEventListener("click", openCart);
      closeCartBtn.addEventListener("click", closeCart);
      cartOverlay.addEventListener("click", closeCart);

      function addToCart(id, name, desc, img, price, btn) {
        const existing = cart.find((item) => item.name === name);
        if (existing) {
          existing.qty += 1;
        } else {
          cart.push({ id, name, desc, img, price: Number(price) || 0, qty: 1 });
        }

        if (btn) {
          const originalText = btn.innerHTML;
          btn.classList.add("added");
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Ditambahkan!';
          setTimeout(() => {
            btn.classList.remove("added");
            btn.innerHTML = originalText;
          }, 1200);
        }

        renderCart();
      }

      function updateQty(name, delta) {
        const item = cart.find((i) => i.name === name);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) {
          cart = cart.filter((i) => i.name !== name);
        }
        renderCart();
      }

      function renderCart() {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

        if (totalItems > 0) {
          cartBadgeCount.style.display = "flex";
          cartBadgeCount.textContent = totalItems;
          cartEmptyMsg.style.display = "none";
          checkoutWaBtn.disabled = false;
        } else {
          cartBadgeCount.style.display = "none";
          cartEmptyMsg.style.display = "block";
          checkoutWaBtn.disabled = true;
        }

        // Render cart DOM items
        const itemElements = cartItemsContainer.querySelectorAll(".cart-item-row");
        itemElements.forEach((el) => el.remove());

        cart.forEach((item) => {
          const row = document.createElement("div");
          row.className = "cart-item-row";
          row.innerHTML = `
          <img src="${item.img}" class="cart-item-img" alt="${item.name}" onerror="this.src='https://placehold.co/100x100/1c1917/fff?text=Product'" />
          <div class="cart-item-info">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-desc">${item.desc}</div>
            <div class="cart-item-controls">
              <button class="qty-btn" onclick="updateQty('${item.name}', -1)">-</button>
              <span style="font-size: 12px; font-weight: 700; padding: 0 4px;">${item.qty}</span>
              <button class="qty-btn" onclick="updateQty('${item.name}', 1)">+</button>
            </div>
          </div>
        `;
          cartItemsContainer.appendChild(row);
        });
      }

      function checkoutToWhatsApp() {
        if (!cart.length) return;

        const lines = cart.map((item) => `• ${item.name} (x${item.qty}) - ${item.desc}`);
        const text = `Halo Admin Corat Coret Layar 👋\n\nSaya ingin memesan produk berikut:\n${lines.join("\n")}\n\nMohon info mengenai estimasi pengerjaan & pembayarannya. Terima kasih!`;

        // Catat transaksi ke dashboard /penjualan lewat API (tidak menghambat
        // proses checkout — kalau gagal/lambat, redirect WhatsApp tetap jalan).
        kirimTransaksiKeDashboard();

        const url = `https://wa.me/6281333385899?text=${encodeURIComponent(text)}`;
        window.open(url, "_blank");
      }

      // Kirim ringkasan keranjang saat ini sebagai 1 transaksi ke dashboard
      // penjualan (/api/v1/sales). Karena landing page & dashboard berada di
      // satu domain Vercel yang sama, cukup panggil path relatif ini.
      async function kirimTransaksiKeDashboard() {
        try {
          const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
          const totalHarga = cart.reduce((sum, item) => sum + item.qty * (Number(item.price) || 0), 0);
          const productSummary = cart.map((item) => `${item.name} (x${item.qty})`).join(", ");

          const res = await fetch("/api/v1/sales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customer: "Pelanggan WhatsApp",
              product: productSummary,
              qty: totalQty,
              total: totalHarga,
              payment_method: "WhatsApp Order",
              status: "Pending",
            }),
          });

          const data = await res.json();
          if (!data.success) {
            console.error("Gagal mencatat transaksi ke dashboard:", data.error);
          }
        } catch (err) {
          // Jangan sampai kegagalan pencatatan menghentikan proses checkout
          // pelanggan — redirect ke WhatsApp tetap harus jalan.
          console.error("Gagal mencatat transaksi ke dashboard:", err);
        }
      }
