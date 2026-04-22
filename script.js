// GOOGLE İLE GİRİŞ FONKSİYONU
function googleIleGiris() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => { console.log("Google ile giriş başarılı!"); })
        .catch((error) => { document.getElementById('auth-hata').innerText = "Hata: " + firebaseHataCevir(error.code); });
}
const auth = firebase.auth();
let mevcutKullanici = null;
let uygulamaYuklendiMi = false; 

// GİRİŞ YAPMA FONKSİYONU
function girisYap() {
    const email = document.getElementById('auth-email').value;
    const sifre = document.getElementById('auth-sifre').value;
    if (!email || !sifre) { document.getElementById('auth-hata').innerText = "E-posta ve şifre boş bırakılamaz!"; return; }
    auth.signInWithEmailAndPassword(email, sifre)
        .catch(error => { document.getElementById('auth-hata').innerText = "Hata: " + firebaseHataCevir(error.code); });
}

// KAYIT OLMA FONKSİYONU
function kayitOl() {
    const email = document.getElementById('auth-email').value;
    const sifre = document.getElementById('auth-sifre').value;
    if (!email || !sifre) { document.getElementById('auth-hata').innerText = "E-posta ve şifre boş bırakılamaz!"; return; }
    if (sifre.length < 6) { document.getElementById('auth-hata').innerText = "Şifre en az 6 karakter olmalıdır!"; return; }
    auth.createUserWithEmailAndPassword(email, sifre)
        .then(() => alert("Kayıt başarılı! Giriş yapılıyor..."))
        .catch(error => { document.getElementById('auth-hata').innerText = "Hata: " + firebaseHataCevir(error.code); });
}

function cikisYap() { auth.signOut().then(() => location.reload()); }

function gelistiriciGiris() {
    mevcutKullanici = { uid: "test_kullanici_123" };
    let yukleniyor = document.getElementById('yukleniyor-ekrani');
    if(yukleniyor) yukleniyor.style.display = 'none';
    document.getElementById('auth-ekrani').style.display = 'none';
    document.getElementById('ana-uygulama').style.display = 'block';
    sessionStorage.setItem('bulutVerisiYuklendi', '1');
    if(!uygulamaYuklendiMi) { uygulamaBaslat(); uygulamaYuklendiMi = true; }
}

function firebaseHataCevir(kod) {
    const hatalar = {
        'auth/user-not-found':         'Kullanıcı bulunamadı.',
        'auth/wrong-password':         'Şifre hatalı.',
        'auth/invalid-email':          'Geçersiz e-posta.',
        'auth/email-already-in-use':   'Bu e-posta zaten kullanımda.',
        'auth/weak-password':          'Şifre çok zayıf. (En az 6 karakter)',
    };
    return hatalar[kod] || ('Hata: ' + kod);
}

auth.onAuthStateChanged((user) => {
    if (mevcutKullanici && mevcutKullanici.uid === "test_kullanici_123") return;
    let yukleniyor = document.getElementById('yukleniyor-ekrani');
    if(yukleniyor) yukleniyor.style.display = 'none';

    if (user) {
        mevcutKullanici = user;
        document.getElementById('auth-ekrani').style.display = 'none';
        document.getElementById('ana-uygulama').style.display = 'block';
        if (!sessionStorage.getItem('bulutVerisiYuklendi')) { verileriBuluttanCek(user.uid); } 
        else { if(!uygulamaYuklendiMi) { uygulamaBaslat(); uygulamaYuklendiMi = true; } }
    } else {
        document.getElementById('auth-ekrani').style.display = 'flex';
        document.getElementById('ana-uygulama').style.display = 'none';
    }
});

function verileriBulutaYedekle() {
    if (!mevcutKullanici || mevcutKullanici.uid === "test_kullanici_123") return;
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        data[k] = localStorage.getItem(k);
    }
    database.ref('users/' + mevcutKullanici.uid + '/' + aktifIsletmeId).set(data).catch(err => console.error(err));
}

function verileriBuluttanCek(uid) {
    if (uid === "test_kullanici_123") {
        sessionStorage.setItem('bulutVerisiYuklendi', '1');
        if(!uygulamaYuklendiMi){ uygulamaBaslat(); uygulamaYuklendiMi = true; }
        return;
    }
    let aktifId = localStorage.getItem('aktifIsletmeId') || '1';
    database.ref('users/' + uid + '/' + aktifId).once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                const izinliPrefixler = ['isletme_', 'aktifIsletmeId', 'isletmeListesi', 'favoriIsletmeId'];
                Object.keys(data).forEach(key => {
                    if (izinliPrefixler.some(prefix => key.startsWith(prefix))) localStorage.setItem(key, data[key]);
                });
            }
            sessionStorage.setItem('bulutVerisiYuklendi', '1');
            location.reload();
        })
        .catch(err => {
            sessionStorage.setItem('bulutVerisiYuklendi', '1');
            if(!uygulamaYuklendiMi){ uygulamaBaslat(); uygulamaYuklendiMi = true; }
        });
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

let isletmeler = JSON.parse(localStorage.getItem('isletmeListesi')) || [{id: '1', ad: 'Ana Çiftliğim'}];
if (!sessionStorage.getItem('uygulamaBasladi')) {
    let favId = localStorage.getItem('favoriIsletmeId');
    if (favId && isletmeler.find(i => i.id === favId)) localStorage.setItem('aktifIsletmeId', favId);
    sessionStorage.setItem('uygulamaBasladi', 'true');
}

let aktifIsletmeId = localStorage.getItem('aktifIsletmeId') || '1';
let aktifIsletme = isletmeler.find(i => i.id === aktifIsletmeId);
if (!aktifIsletme) {
    aktifIsletme = isletmeler[0];
    aktifIsletmeId = aktifIsletme.id;
    localStorage.setItem('aktifIsletmeId', aktifIsletmeId);
}

let APP_PREFIX = 'isletme_' + aktifIsletmeId + '_';
let patokSayisi = 0;

const KAYIT_ALANLARI  = ['fiyatArpa','arpaTorbaKg','fiyatMisir','fiyatYem','fiyatSoya','fiyatSaman','guncelEtFiyati'];
const PATOK_ALANLARI  = ['sayi','kg','hedef','artis','yemProtein','yemEnerji','arpa','misir','yem','soya','saman','alisFiyati','alisKg','alisTarihi','karkasRandiman','fire','aylikArtis', 'aktif'];
const STOK_ALANLARI   = ['stokArpa','stokMisir','stokYem','stokSoya','stokSaman'];
const DAMIZLIK_KAYIT_ALANLARI = ['fiyatSutYemi', 'fiyatSilaj', 'fiyatYonca', 'fiyatArpaDamizlik', 'fiyatSamanDamizlik', 'd_sayi', 'd_ortSut', 'd_sutYemi', 'd_silaj', 'd_yonca', 'd_arpa', 'd_saman', 'sutMandiraFiyat', 'sutPerakendeFiyat'];
const ATLANACAK_ALANLAR = ['saglikTarih','saglikIlac','saglikDoz','saglikPatokSec','inekKupe','inekLaktasyon','inekSut','inekDurum','tohumTarihi','spermaKodu','tohumlamaInekSec', 'giderTarih', 'giderKategori', 'giderAciklama', 'giderTutar', 'sutSatisTarih', 'sutSatisToplam', 'sutMandiraLt', 'sutPerakendeLt'];
const IZINLI_KEY_PREFIXLER = ['isletme_', 'aktifIsletmeId', 'isletmeListesi', 'favoriIsletmeId'];

function isletmeDropdownDoldur() {
    let select = document.getElementById('isletmeSecici');
    select.innerHTML = '';
    isletmeler.forEach(i => {
        let opt = document.createElement('option');
        opt.value = i.id;
        opt.text = i.ad + ((i.id === localStorage.getItem('favoriIsletmeId')) ? ' ⭐ (Favori)' : '');
        if (i.id === aktifIsletmeId) opt.selected = true;
        select.appendChild(opt);
    });
}

function isletmeDegistir(id) { localStorage.setItem('aktifIsletmeId', id); location.reload(); }
function yeniIsletmeEkle() {
    let ad = prompt("Yeni işletmenin adını giriniz:");
    if (!ad) return;
    let yeniId = Date.now().toString();
    isletmeler.push({id: yeniId, ad: ad.trim()});
    localStorage.setItem('isletmeListesi', JSON.stringify(isletmeler));
    localStorage.setItem('aktifIsletmeId', yeniId);
    location.reload();
}
function isletmeSil() {
    if (isletmeler.length <= 1) { alert("Tek kalan ana işletmeyi silemezsiniz!"); return; }
    if (confirm(aktifIsletme.ad + " işletmesini silmek istediğinize emin misiniz? Bütün verileri kalıcı olarak silinecek!")) {
        let silinecekPrefix = 'isletme_' + aktifIsletmeId + '_';
        Object.keys(localStorage).forEach(key => { if (key.startsWith(silinecekPrefix)) localStorage.removeItem(key); });
        isletmeler = isletmeler.filter(i => i.id !== aktifIsletmeId);
        localStorage.setItem('isletmeListesi', JSON.stringify(isletmeler));
        localStorage.setItem('aktifIsletmeId', isletmeler[0].id);
        location.reload();
    }
}
function favoriIsletmeKaydet() {
    localStorage.setItem('favoriIsletmeId', aktifIsletmeId);
    alert(aktifIsletme.ad + " işletmesi artık uygulamayı açtığınızda ilk olarak yüklenecek!");
    isletmeDropdownDoldur();
}

function yedekAl() {
    let yedekVerisi = {};
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(APP_PREFIX) || key === 'isletmeListesi' || key === 'aktifIsletmeId' || key === 'favoriIsletmeId') {
            yedekVerisi[key] = localStorage.getItem(key);
        }
    });
    let a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(yedekVerisi, null, 2)], {type: 'application/json'}));
    a.download = 'yildiz_ciftlik_yedek_' + new Date().toLocaleDateString('tr-TR').replace(/\./g, '-') + '.json';
    a.click();
}

function yedekYukle(event) {
    let dosya = event.target.files[0];
    if (!dosya) return;
    if (!confirm("Yedek yüklenecek. Mevcut veriler üzerine yazılacak. Emin misiniz?")) { event.target.value = ''; return; }
    let reader = new FileReader();
    reader.onload = function(e) {
        try {
            let veri = JSON.parse(e.target.result);
            let yazilan = 0;
            Object.keys(veri).forEach(key => {
                if (IZINLI_KEY_PREFIXLER.some(prefix => key.startsWith(prefix))) {
                    if (typeof veri[key] === 'string') { localStorage.setItem(key, veri[key]); yazilan++; }
                }
            });
            if (yazilan === 0) { alert("Hata: Geçersiz yedek dosyası!"); return; }
            alert("Yedek başarıyla yüklendi! Sayfa yenileniyor...");
            location.reload();
        } catch(err) { alert("Hata: Geçersiz yedek!"); }
    };
    reader.readAsText(dosya);
    event.target.value = '';
}

function modulDegistir(modulId, btnElement) {
    document.querySelectorAll('.modul-icerik').forEach(el => el.classList.remove('aktif-modul-icerik'));
    document.querySelectorAll('.modul-btn').forEach(el => el.classList.remove('aktif-modul'));
    document.getElementById(modulId).classList.add('aktif-modul-icerik');
    btnElement.classList.add('aktif-modul');
    localStorage.setItem('sonKullanilanModul', modulId);
    if(modulId === 'kesimModulu') { kesimListele(); }
}

function sekmeDegistir(sekmeId, btnElement) {
    document.querySelectorAll('#besiModulu .sekme-icerik').forEach(el => el.classList.remove('aktif-sekme'));
    document.querySelectorAll('#besiModulu .sekme-btn').forEach(el => el.classList.remove('aktif'));
    document.getElementById(sekmeId).classList.add('aktif-sekme');
    btnElement.classList.add('aktif');
    if (sekmeId === 'stokSekmesi') {
        document.getElementById('arpaTorbaKg_stok').value = document.getElementById('arpaTorbaKg').value || 43;
        stokGoster();
    }
}

function sekmeDegistirDamizlik(sekmeId, btnElement) {
    document.querySelectorAll('#damizlikModulu .sekme-icerik').forEach(el => el.classList.remove('aktif-sekme'));
    document.querySelectorAll('#damizlikModulu .sekme-btn').forEach(el => el.classList.remove('aktif'));
    document.getElementById(sekmeId).classList.add('aktif-sekme');
    btnElement.classList.add('aktif');
}

document.addEventListener('input', function(e) {
    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'select') {
        if (!ATLANACAK_ALANLAR.includes(e.target.id) && !e.target.id.startsWith('kesimModal')) {
            hesapla();
            damizlikRasyonHesapla();
            let stokSekme = document.getElementById('stokSekmesi');
            if (stokSekme && stokSekme.classList.contains('aktif-sekme')) stokGoster();
        }
    }
});

document.addEventListener('change', function(e) {
    if (e.target.tagName.toLowerCase() === 'input' && e.target.type === 'checkbox') {
        hesapla();
        let stokSekme = document.getElementById('stokSekmesi');
        if (stokSekme && stokSekme.classList.contains('aktif-sekme')) stokGoster();
    }
});

window.onload = function() {
    setTimeout(function() {
        let yukleniyor = document.getElementById('yukleniyor-ekrani');
        if (yukleniyor) yukleniyor.style.display = 'none';
        let authEkrani = document.getElementById('auth-ekrani');
        let anaUygulama = document.getElementById('ana-uygulama');
        if (authEkrani && anaUygulama && authEkrani.style.display === 'none' && anaUygulama.style.display === 'none') {
            authEkrani.style.display = 'flex';
        }
    }, 1000);

    if (sessionStorage.getItem('bulutVerisiYuklendi') && !uygulamaYuklendiMi) {
        uygulamaBaslat();
        uygulamaYuklendiMi = true;
    }
};

function uygulamaBaslat() {
    isletmeDropdownDoldur();
    sayaclariCalistir(); 

    let sonModul = localStorage.getItem('sonKullanilanModul') || 'besiModulu';
    let modulBtn = document.getElementById('btn-' + sonModul);
    if (modulBtn) modulDegistir(sonModul, modulBtn);

    let kayitliPatokSayisi = localStorage.getItem(APP_PREFIX + 'patokSayisi');
    let adet = kayitliPatokSayisi ? parseInt(kayitliPatokSayisi) : 1;
    for (let i = 1; i <= adet; i++) { patokEkle(false); }

    KAYIT_ALANLARI.forEach(id => { let val = localStorage.getItem(APP_PREFIX + id); if (val !== null && document.getElementById(id)) document.getElementById(id).value = val; });
    DAMIZLIK_KAYIT_ALANLARI.forEach(id => { let val = localStorage.getItem(APP_PREFIX + id); if (val !== null && document.getElementById(id)) document.getElementById(id).value = val; });

    for (let i = 1; i <= patokSayisi; i++) {
        PATOK_ALANLARI.forEach(alan => {
            let el = document.getElementById('p' + i + '_' + alan);
            if (!el) return;
            let val = localStorage.getItem(APP_PREFIX + 'p' + i + '_' + alan);
            if (val !== null) {
                if (el.type === 'checkbox') el.checked = (val === 'true');
                else el.value = val;
            }
        });
    }

    let arpaBirim = localStorage.getItem(APP_PREFIX + 'stokArpaBirim');
    if (arpaBirim) document.getElementById('stokArpaBirim').value = arpaBirim;
    STOK_ALANLARI.forEach(id => { let val = localStorage.getItem(APP_PREFIX + id); if (val !== null && document.getElementById(id)) document.getElementById(id).value = val; });

    let bugunFormat = new Date().toISOString().split('T')[0];
    if(document.getElementById('saglikTarih')) document.getElementById('saglikTarih').value = bugunFormat;
    if(document.getElementById('giderTarih')) document.getElementById('giderTarih').value = bugunFormat;
    if(document.getElementById('sutSatisTarih')) document.getElementById('sutSatisTarih').value = bugunFormat;
    if(document.getElementById('kesimModal_tarih')) document.getElementById('kesimModal_tarih').value = bugunFormat;

    stokOtomatikDus();
    hesapla();
    damizlikRasyonHesapla();
    stokGoster();
    saglikPatokGuncelle();
    saglikListele();
    inekListele();
    tohumlamaInekDoldur();
    tohumlamaListele();
    giderListele();
    sutSatisListele();
    kesimListele();
}

function tumAlanlarıKaydet() {
    KAYIT_ALANLARI.forEach(id => { let el = document.getElementById(id); if (el) localStorage.setItem(APP_PREFIX + id, el.value); });
    for (let i = 1; i <= patokSayisi; i++) {
        PATOK_ALANLARI.forEach(alan => {
            let el = document.getElementById('p' + i + '_' + alan);
            if (el) {
                if (el.type === 'checkbox') localStorage.setItem(APP_PREFIX + 'p' + i + '_' + alan, el.checked);
                else localStorage.setItem(APP_PREFIX + 'p' + i + '_' + alan, el.value);
            }
        });
    }
}

// ─── OTOMATİK STOK DÜŞME VE KİLO ALIMI ───────────────────────────────────
function stokOtomatikDus() {
    let bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    let bugunTarih = bugun.getTime();
    let sonTarih   = localStorage.getItem(APP_PREFIX + 'stokTarih');

    if (sonTarih) {
        sonTarih = parseInt(sonTarih);
        if (bugunTarih > sonTarih) {
            let gunFarki = Math.floor((bugunTarih - sonTarih) / (1000 * 60 * 60 * 24));

            let gArpa  = parseFloat(localStorage.getItem(APP_PREFIX + 'tuketim_arpa'))  || 0;
            let gMisir = parseFloat(localStorage.getItem(APP_PREFIX + 'tuketim_misir')) || 0;
            let gYem   = parseFloat(localStorage.getItem(APP_PREFIX + 'tuketim_yem'))   || 0;
            let gSoya  = parseFloat(localStorage.getItem(APP_PREFIX + 'tuketim_soya'))  || 0;
            let gSaman = parseFloat(localStorage.getItem(APP_PREFIX + 'tuketim_saman')) || 0;

            let arpaBirim   = localStorage.getItem(APP_PREFIX + 'stokArpaBirim') || 'kg';
            let sArpa       = parseFloat(localStorage.getItem(APP_PREFIX + 'stokArpa'))  || 0;
            let sMisir      = parseFloat(localStorage.getItem(APP_PREFIX + 'stokMisir')) || 0;
            let sYem        = parseFloat(localStorage.getItem(APP_PREFIX + 'stokYem'))   || 0;
            let sSoya       = parseFloat(localStorage.getItem(APP_PREFIX + 'stokSoya'))  || 0;
            let sSaman      = parseFloat(localStorage.getItem(APP_PREFIX + 'stokSaman')) || 0;
            let arpaTorbaKg = parseFloat(localStorage.getItem(APP_PREFIX + 'arpaTorbaKg')) || 43;

            let arpaKgOlarak = (arpaBirim === 'torba') ? (sArpa * arpaTorbaKg) : sArpa;
            arpaKgOlarak = Math.max(0, arpaKgOlarak - (gArpa * gunFarki));
            sMisir = Math.max(0, sMisir - (gMisir * gunFarki));
            sYem   = Math.max(0, sYem   - (gYem   * gunFarki));
            sSoya  = Math.max(0, sSoya  - (gSoya  * gunFarki));
            sSaman = Math.max(0, sSaman - (gSaman * gunFarki));
            sArpa  = (arpaBirim === 'torba') ? (arpaKgOlarak / arpaTorbaKg) : arpaKgOlarak;

            let yeniStoklar = { stokArpa: sArpa.toFixed(1), stokMisir: sMisir.toFixed(1), stokYem: sYem.toFixed(1), stokSoya: sSoya.toFixed(1), stokSaman: sSaman.toFixed(1) };
            Object.keys(yeniStoklar).forEach(key => {
                localStorage.setItem(APP_PREFIX + key, yeniStoklar[key]);
                let el = document.getElementById(key);
                if (el) el.value = yeniStoklar[key];
            });

            let pSayisi = parseInt(localStorage.getItem(APP_PREFIX + 'patokSayisi')) || 1;
            for (let i = 1; i <= pSayisi; i++) {
                let aktifDurum = localStorage.getItem(APP_PREFIX + 'p' + i + '_aktif');
                if (aktifDurum !== null && aktifDurum !== 'true') continue; 
                
                let mevcutKg   = parseFloat(localStorage.getItem(APP_PREFIX + 'p' + i + '_kg'))    || 0;
                let patokArtis = parseFloat(localStorage.getItem(APP_PREFIX + 'p' + i + '_artis')) || 1.35;
                if (mevcutKg > 0) {
                    let yeniKg = mevcutKg + (patokArtis * gunFarki);
                    localStorage.setItem(APP_PREFIX + 'p' + i + '_kg', yeniKg.toFixed(1));
                    let kgInput = document.getElementById('p' + i + '_kg');
                    if (kgInput) kgInput.value = yeniKg.toFixed(1);
                }
            }
        }
    }
    localStorage.setItem(APP_PREFIX + 'stokTarih', bugunTarih);
}

// ─── PATOK EKLE / SİL ────────────────────────────────────────────────────
function patokEkle(kaydet = true) {
    patokSayisi++;

    let rContainer = document.getElementById('patoklar');
    let yPatok = document.createElement('div');
    yPatok.className = 'patok-card';
    yPatok.id = 'patok_' + patokSayisi;
    yPatok.innerHTML = `
        <h3 style="display: flex; justify-content: space-between; align-items: center; border-bottom: none; padding-bottom: 0;">
            <span>Patok ${patokSayisi} - Rasyon</span>
            <label style="font-size: 11px; color: #27ae60; cursor: pointer; display: flex; align-items: center; gap: 5px; background: #e8f8f5; padding: 4px 8px; border-radius: 4px; border: 1px solid #27ae60;">
                <input type="checkbox" id="p${patokSayisi}_aktif" checked style="width: 14px; height: 14px; margin:0;"> 
                Aktif Patok
            </label>
        </h3>
        <div style="border-top: 2px solid #ecf0f1; margin-top: 5px; padding-top: 10px;"></div>
        <div class="dortlu-grup">
            <div class="form-group"><label>Hayvan Sayısı</label><input type="number" id="p${patokSayisi}_sayi"></div>
            <div class="form-group"><label>Canlı Kg</label><input type="number" id="p${patokSayisi}_kg" placeholder="Örn: 350"></div>
            <div class="form-group"><label>Hedef Kg</label><input type="number" id="p${patokSayisi}_hedef" placeholder="Örn: 600"></div>
            <div class="form-group"><label>Günlük Tahmini Artış</label><input type="number" id="p${patokSayisi}_artis" placeholder="Örn: 1.35" step="0.01"></div>
        </div>
        <div class="ikili-grup">
            <div class="form-group"><label>Yem Proteini (%)</label><input type="number" id="p${patokSayisi}_yemProtein" placeholder="Örn: 14" step="0.1"></div>
            <div class="form-group"><label>Yem Enerjisi (ME)</label><input type="number" id="p${patokSayisi}_yemEnerji" placeholder="Örn: 2.6" step="0.1"></div>
        </div>
        <div class="grid-5">
            <div><label class="kucuk-label">Arpa (Top. kg)</label><input type="number" id="p${patokSayisi}_arpa" step="0.1"></div>
            <div><label class="kucuk-label">Mısır (Top. kg)</label><input type="number" id="p${patokSayisi}_misir" step="0.1"></div>
            <div><label class="kucuk-label">Yem (Top. kg)</label><input type="number" id="p${patokSayisi}_yem" step="0.1"></div>
            <div><label class="kucuk-label">Soya (Top. kg)</label><input type="number" id="p${patokSayisi}_soya" step="0.1"></div>
            <div><label class="kucuk-label">Saman (Top. kg)</label><input type="number" id="p${patokSayisi}_saman" step="0.1"></div>
        </div>
        <div id="sonuc_p${patokSayisi}" class="patok-ic-sonuc" style="display:none;"></div>
        
        <div style="display:flex; gap:10px; margin-top: 15px;">
            <button type="button" onclick="patokuKesimeGonder(${patokSayisi})" style="background-color: #f39c12; flex:1; font-size:12px;">🔪 KESİME GÖNDER</button>
            <button type="button" onclick="patokSil(${patokSayisi})" style="background-color: #c0392b; flex:1; font-size:12px;">🗑️ PATOKU SİL</button>
        </div>
    `;
    rContainer.appendChild(yPatok);

    let fContainer = document.getElementById('finansPatoklar');
    let fPatok = document.createElement('div');
    fPatok.className = 'patok-card';
    fPatok.id = 'finans_patok_' + patokSayisi;
    fPatok.innerHTML = `
        <h3>Patok ${patokSayisi} - Finans Bilgileri</h3>
        <div class="uclu-grup">
            <div class="form-group"><label>Hayvan Başı Alış Fiyatı (TL)</label><input type="number" id="p${patokSayisi}_alisFiyati" placeholder="Örn: 45000"></div>
            <div class="form-group"><label>İlk Alış Canlı Kg</label><input type="number" id="p${patokSayisi}_alisKg" placeholder="Örn: 250"></div>
            <div class="form-group"><label>Sürüye Alış Tarihi</label><input type="date" id="p${patokSayisi}_alisTarihi"></div>
        </div>
        <div class="uclu-grup">
            <div class="form-group"><label>Karkas Randımanı (%)</label><input type="number" id="p${patokSayisi}_karkasRandiman" placeholder="Örn: 55" value="55"></div>
            <div class="form-group"><label>Fire Oranı (%)</label><input type="number" id="p${patokSayisi}_fire" placeholder="Örn: 2" value="2"></div>
            <div class="form-group"><label>Aylık Canlı Kg Alışı</label><input type="number" id="p${patokSayisi}_aylikArtis" placeholder="Örn: 40"></div>
        </div>
        <div id="finans_sonuc_p${patokSayisi}" class="patok-ic-sonuc" style="display:none;"></div>
    `;
    fContainer.appendChild(fPatok);

    if (kaydet) localStorage.setItem(APP_PREFIX + 'patokSayisi', patokSayisi);
    saglikPatokGuncelle();
}

function patokSil(silId) {
    if (patokSayisi <= 1 || silId === 1) { alert("Sistemde en az 1 patok kalmalıdır ve Patok 1 silinemez!"); return; }
    if (!confirm(silId + " numaralı patoku siliyorum. Emin misin?")) return;

    for (let i = silId; i < patokSayisi; i++) {
        let sonrakiId = i + 1;
        PATOK_ALANLARI.forEach(alan => {
            let sonrakiDeger = localStorage.getItem(APP_PREFIX + 'p' + sonrakiId + '_' + alan);
            if (sonrakiDeger !== null) localStorage.setItem(APP_PREFIX + 'p' + i + '_' + alan, sonrakiDeger);
            else localStorage.removeItem(APP_PREFIX + 'p' + i + '_' + alan);
        });
    }

    PATOK_ALANLARI.forEach(alan => localStorage.removeItem(APP_PREFIX + 'p' + patokSayisi + '_' + alan));

    localStorage.removeItem(APP_PREFIX + 'tuketim_arpa');
    localStorage.removeItem(APP_PREFIX + 'tuketim_misir');
    localStorage.removeItem(APP_PREFIX + 'tuketim_yem');
    localStorage.removeItem(APP_PREFIX + 'tuketim_soya');
    localStorage.removeItem(APP_PREFIX + 'tuketim_saman');

    let saglikKayitlari = JSON.parse(localStorage.getItem(APP_PREFIX + 'saglik')) || [];
    let yeniSaglik = [];
    saglikKayitlari.forEach(k => {
        let pNo = parseInt(k.patok);
        if (pNo !== silId) {
            if (pNo > silId) k.patok = String(pNo - 1);
            yeniSaglik.push(k);
        }
    });
    localStorage.setItem(APP_PREFIX + 'saglik', JSON.stringify(yeniSaglik));

    patokSayisi--;
    localStorage.setItem(APP_PREFIX + 'patokSayisi', patokSayisi);
    alert("Patok silindi!");
    location.reload();
}

// ─── HESAPLA (RASYON + FİNANS) ───────────────────────────────────────────
function hesapla() {
    let fArpa       = parseFloat(document.getElementById('fiyatArpa').value)  || 0;
    let fSaman      = parseFloat(document.getElementById('fiyatSaman').value) || 0;
    let fSoya       = parseFloat(document.getElementById('fiyatSoya').value)  || 0;
    let fMisirTorba = parseFloat(document.getElementById('fiyatMisir').value) || 0;
    let fMisir      = fMisirTorba / 40;
    let fYemTorba   = parseFloat(document.getElementById('fiyatYem').value)   || 0;
    let fYem        = fYemTorba / 50;

    let hpArpa  = 11,   meArpa  = 2.8;
    let hpMisir = 8.5,  meMisir = 3.1;
    let hpSoya  = 44,   meSoya  = 2.8;

    let etFiyati = parseFloat(document.getElementById('guncelEtFiyati').value) || 0;

    let genelGider     = 0;
    let genelArpaGider = 0, genelMisirGider = 0, genelYemGider = 0;
    let genelSoyaGider = 0, genelSamanGider = 0;
    let genelArpaKg = 0, genelMisirKg = 0, genelYemKg = 0, genelSoyaKg = 0, genelSamanKg = 0;

    for (let i = 1; i <= patokSayisi; i++) {
        let elAktif = document.getElementById('p' + i + '_aktif');
        let p_aktif = elAktif ? elAktif.checked : true;

        let patokDiv = document.getElementById('patok_' + i);
        let finansDiv = document.getElementById('finans_patok_' + i);
        if (patokDiv) patokDiv.style.opacity = p_aktif ? '1' : '0.5';
        if (finansDiv) finansDiv.style.opacity = p_aktif ? '1' : '0.5';

        let s      = parseFloat(document.getElementById('p' + i + '_sayi').value)   || 0;
        let ckg    = parseFloat(document.getElementById('p' + i + '_kg').value)     || 0;
        let hkg    = parseFloat(document.getElementById('p' + i + '_hedef').value)  || 0;
        let artis  = parseFloat(document.getElementById('p' + i + '_artis').value)  || 1.35;

        let yemProtein = parseFloat(document.getElementById('p' + i + '_yemProtein').value) || 14;
        let meYem      = parseFloat(document.getElementById('p' + i + '_yemEnerji').value)  || 2.6;

        let alisTarihi  = document.getElementById('p' + i + '_alisTarihi').value;
        let alisFiyati  = parseFloat(document.getElementById('p' + i + '_alisFiyati').value) || 0;
        let alisKg      = parseFloat(document.getElementById('p' + i + '_alisKg').value)     || 0;
        let karkasRandiman = parseFloat(document.getElementById('p' + i + '_karkasRandiman').value) || 55;
        let fireOrani      = parseFloat(document.getElementById('p' + i + '_fire').value)          || 0;
        let aylikArtisInput = parseFloat(document.getElementById('p' + i + '_aylikArtis').value);

        let a_toplam  = parseFloat(document.getElementById('p' + i + '_arpa').value)  || 0;
        let m_toplam  = parseFloat(document.getElementById('p' + i + '_misir').value) || 0;
        let y_toplam  = parseFloat(document.getElementById('p' + i + '_yem').value)   || 0;
        let sy_toplam = parseFloat(document.getElementById('p' + i + '_soya').value)  || 0;
        let sm_toplam = parseFloat(document.getElementById('p' + i + '_saman').value) || 0;

        let patokKesifKg = a_toplam + m_toplam + y_toplam + sy_toplam;

        let arpaMaliyet  = a_toplam  * fArpa;
        let misirMaliyet = m_toplam  * fMisir;
        let yemMaliyet   = y_toplam  * fYem;
        let soyaMaliyet  = sy_toplam * fSoya;
        let samanMaliyet = sm_toplam * fSaman;
        let pt_maliyet   = arpaMaliyet + misirMaliyet + yemMaliyet + soyaMaliyet + samanMaliyet;

        if (p_aktif) {
            genelArpaKg  += a_toplam;
            genelMisirKg += m_toplam;
            genelYemKg   += y_toplam;
            genelSoyaKg  += sy_toplam;
            genelSamanKg += sm_toplam;

            genelArpaGider  += arpaMaliyet;
            genelMisirGider += misirMaliyet;
            genelYemGider   += yemMaliyet;
            genelSoyaGider  += soyaMaliyet;
            genelSamanGider += samanMaliyet;
            genelGider      += pt_maliyet;
        }

        let hb_maliyet = 0, a_hb = 0, m_hb = 0, y_hb = 0, sy_hb = 0, kesifKilo_hb = 0;
        let rasyonHP = 0, rasyonME = 0, oneriHP = 0, oneriME = 0;
        let kesimMetni = "";
        let iceridekiGun = 0;

        if (alisTarihi) {
            let d1 = new Date(alisTarihi);
            let d2 = new Date();
            d1.setHours(0,0,0,0); d2.setHours(0,0,0,0);
            if (d2 >= d1) iceridekiGun = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
        }

        if (s > 0) {
            hb_maliyet   = pt_maliyet / s;
            a_hb         = a_toplam  / s;
            m_hb         = m_toplam  / s;
            y_hb         = y_toplam  / s;
            sy_hb        = sy_toplam / s;
            kesifKilo_hb = a_hb + m_hb + y_hb + sy_hb;

            if (kesifKilo_hb > 0) {
                rasyonHP = ((a_hb * hpArpa) + (m_hb * hpMisir) + (y_hb * yemProtein) + (sy_hb * hpSoya)) / kesifKilo_hb;
                rasyonME = ((a_hb * meArpa) + (m_hb * meMisir) + (y_hb * meYem)       + (sy_hb * meSoya)) / kesifKilo_hb;
            }

            if (ckg > 0) {
                if      (ckg < 250) { oneriHP = 15.0; oneriME = 2.60; }
                else if (ckg < 350) { oneriHP = 14.0; oneriME = 2.70; }
                else if (ckg < 450) { oneriHP = 13.0; oneriME = 2.80; }
                else                { oneriHP = 12.0; oneriME = 2.90; }
            }

            if (ckg > 0 && hkg > 0) {
                if (ckg >= hkg) {
                    kesimMetni = `<div class="hedef-kutu" style="color:#27ae60; border-color:#27ae60; background:#e8f8f5;">Hedef kesim kilosuna ulaşıldı! (${ckg.toFixed(1)} kg)</div>`;
                } else {
                    let kalanKg  = hkg - ckg;
                    let kalanGun = Math.ceil(kalanKg / artis);
                    let kesimTarihi = new Date();
                    kesimTarihi.setDate(kesimTarihi.getDate() + kalanGun);
                    let tarihMetni = kesimTarihi.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
                    kesimMetni = `<div class="hedef-kutu">Hedef Kesim (${hkg} kg): Kalan ${kalanGun} Gün ➔ <strong>${tarihMetni}</strong> <br><span style="font-size:10px; font-weight:normal;">(Rasyondaki ${artis} kg artış ile hesaplandı)</span></div>`;
                }
            }
        }

        let oneriMetni = ckg > 0 ? `<div class="oneri-kutu">Hedef (Önerilen) ➔ HP: %${oneriHP.toFixed(1)} | ME: ${oneriME.toFixed(2)} Mcal</div>` : "";
        let aktifUyari = p_aktif ? "" : `<div style="background:#fadbd8; color:#c0392b; font-size:12px; font-weight:bold; padding:6px; border-radius:4px; margin-bottom:8px; border: 1px solid #e74c3c;">⚠️ BU PATOK İNAKTİF: Stoktan düşülmez, maliyete eklenmez.</div>`;

        let patokSonucDiv = document.getElementById('sonuc_p' + i);
        if (patokSonucDiv) {
            if (s > 0 || pt_maliyet > 0) {
                patokSonucDiv.innerHTML = `
                    ${aktifUyari}
                    <div><strong>Patok Toplam Kesif Yem:</strong> <span style="color:#e67e22;">${patokKesifKg.toFixed(1)} kg</span></div>
                    <div><strong>Günlük Toplam Rasyon Gideri:</strong> ${pt_maliyet.toFixed(2)} TL | <strong>Mal Başı:</strong> <span style="color:#c0392b; font-size:15px;">${hb_maliyet.toFixed(2)} TL</span></div>
                    <div class="tuketim-kutu">
                        <strong>Mal Başı Kesif Yem (${kesifKilo_hb.toFixed(1)} kg):</strong><br>
                        Arpa: ${a_hb.toFixed(1)} kg | Mısır Flake: ${m_hb.toFixed(1)} kg | Yem: ${y_hb.toFixed(1)} kg | Soya: ${sy_hb.toFixed(1)} kg
                    </div>
                    <div class="deger-kutu">Mevcut Rasyon ➔ HP: %${rasyonHP.toFixed(1)} | ME: ${rasyonME.toFixed(2)} Mcal</div>
                    ${oneriMetni}
                    ${kesimMetni}
                `;
                patokSonucDiv.style.display = 'block';
            } else {
                patokSonucDiv.style.display = 'none';
            }
        }

        let finansSonucDiv = document.getElementById('finans_sonuc_p' + i);
        if (finansSonucDiv) {
            if (s > 0 && ckg > 0) {
                let finansGunlukArtis = artis;
                if (aylikArtisInput > 0) {
                    finansGunlukArtis = aylikArtisInput / 30.44;
                }

                let tuketimKatsayisi = 1;
                if (alisKg > 0 && ckg >= alisKg) {
                    let ortalamaKg = (alisKg + ckg) / 2;
                    tuketimKatsayisi = ortalamaKg / ckg;
                }

                let yagliKarkasKg  = ckg * (karkasRandiman / 100);
                let fireKg         = yagliKarkasKg * (fireOrani / 100);
                let netEtKg        = yagliKarkasKg - fireKg;

                let brutDeger       = yagliKarkasKg * etFiyati;
                let fireKesintiTL   = fireKg * etFiyati;
                let netSatisDegeri  = brutDeger - fireKesintiTL;

                let toplamKesintiOrani      = fireOrani;
                let gunlukYagliKarkasArtisi = finansGunlukArtis * (karkasRandiman / 100);
                let gunlukNetKarkasArtisi   = gunlukYagliKarkasArtisi * (1 - (toplamKesintiOrani / 100));

                let birimKarkasMaliyet = (gunlukNetKarkasArtisi > 0) ? (hb_maliyet / gunlukNetKarkasArtisi) : 0;

                let ortalamaGecmisMaliyet = hb_maliyet * tuketimKatsayisi;
                let toplamYedirilenYem    = iceridekiGun * ortalamaGecmisMaliyet;
                let guncelMaliyet         = alisFiyati + toplamYedirilenYem;
                
                // BU DEĞERİ MODAL İÇİN SAKLIYORUZ (Gizli attribute olarak)
                finansSonucDiv.setAttribute('data-guncel-maliyet', guncelMaliyet.toFixed(2));

                let tahminiKarZarar = netSatisDegeri - guncelMaliyet;
                let karZararRenk    = tahminiKarZarar >= 0 ? "27ae60" : "e74c3c";
                let karZararBg      = tahminiKarZarar >= 0 ? "e8f8f5" : "fdedec";

                let alisKilosuMetni = alisKg > 0 ? `(İlk Alış: ${alisKg} kg)` : ``;
                let beklenenCanliKgMetni = "";

                if (alisKg > 0 && iceridekiGun > 0) {
                    let beklenenKg   = alisKg + (iceridekiGun * finansGunlukArtis);
                    let aciklamaMetni = aylikArtisInput > 0 ? `Aylık ${aylikArtisInput} kg hedefine göre` : `Günlük ${artis} kg hedefine göre`;
                    beklenenCanliKgMetni = `<div style="margin-bottom: 5px;"><strong>Olması Gereken Canlı Kg:</strong> <span style="color:#2980b9; font-size:15px;">${beklenenKg.toFixed(1)} kg</span> <span style="font-size:11px; color:#7f8c8d;">(${aciklamaMetni})</span></div>`;
                }

                finansSonucDiv.innerHTML = `
                    <div style="margin-bottom: 5px;"><strong>İçerideki Süre:</strong> <span style="color:#8e44ad; font-size:15px;">${iceridekiGun} Gün</span></div>
                    ${beklenenCanliKgMetni}

                    <table style="width:100%; font-size:12px; border-collapse:collapse; margin-top:10px; margin-bottom:10px; background:#fff; border:1px solid #ddd; border-radius:5px; overflow:hidden;">
                        <tr style="background:#2c3e50; color:white;">
                            <th style="padding:6px; text-align:left;">Karkas Analizi</th>
                            <th style="padding:6px; text-align:right;">Miktar</th>
                            <th style="padding:6px; text-align:right;">Değer</th>
                        </tr>
                        <tr>
                            <td style="padding:6px; border-bottom:1px solid #eee;">Brüt Yağlı Karkas (%${karkasRandiman})</td>
                            <td style="padding:6px; text-align:right; border-bottom:1px solid #eee; font-weight:bold;">${yagliKarkasKg.toFixed(1)} kg</td>
                            <td style="padding:6px; text-align:right; border-bottom:1px solid #eee;">${brutDeger.toFixed(2)} ₺</td>
                        </tr>
                        <tr>
                            <td style="padding:6px; border-bottom:1px solid #eee; color:#e74c3c;">- Fire / Fire Kaybı (%${fireOrani})</td>
                            <td style="padding:6px; text-align:right; border-bottom:1px solid #eee; color:#e74c3c;">-${fireKg.toFixed(1)} kg</td>
                            <td style="padding:6px; text-align:right; border-bottom:1px solid #eee; color:#e74c3c;">-${fireKesintiTL.toFixed(2)} ₺</td>
                        </tr>
                        <tr style="background:#e8f8f5;">
                            <td style="padding:6px; font-weight:bold; color:#27ae60;">NET SATILABİLİR ET</td>
                            <td style="padding:6px; text-align:right; font-weight:bold; color:#27ae60; font-size:13px;">${netEtKg.toFixed(1)} kg</td>
                            <td style="padding:6px; text-align:right; font-weight:bold; color:#27ae60; font-size:13px;">${netSatisDegeri.toFixed(2)} ₺</td>
                        </tr>
                    </table>

                    <div style="margin-bottom: 5px; padding-top: 5px; border-top: 1px dashed #ccc;">
                        <strong>1 KG <span style="color:#c0392b;">NET YAĞSIZ ETİN</span> YEM MALİYETİ:</strong>
                        <span style="color:#c0392b; font-size:16px;">${birimKarkasMaliyet.toFixed(2)} TL</span>
                    </div>

                    <div class="tuketim-kutu">
                        <strong>Maliyet Tablosu (Hayvan Başı)</strong><br>
                        Alış Maliyeti: ${alisFiyati.toFixed(2)} TL <span style="font-size:11px; color:#7f8c8d;">${alisKilosuMetni}</span><br>
                        Toplam Yedirilen Yem: ${toplamYedirilenYem.toFixed(2)} TL <span style="font-size:10px; color:#7f8c8d;">(Büyüme ortalamasıyla hesaplandı)</span><br>
                        <span style="color:#e74c3c; font-size:13px;"><strong>Güncel Toplam Maliyet: ${guncelMaliyet.toFixed(2)} TL</strong></span>
                    </div>

                    <div class="hedef-kutu" style="background:#${karZararBg}; border-color:#${karZararRenk}; color:#${karZararRenk}; margin-top:8px;">
                        <strong>Bugün Kesilirse Net Kâr/Zarar:</strong> ${tahminiKarZarar.toFixed(2)} TL
                    </div>
                `;
                finansSonucDiv.style.display = 'block';
            } else {
                finansSonucDiv.style.display = 'none';
            }
        }
    }

    let genelYemTorba   = genelYemKg   / 50;
    let genelMisirTorba = genelMisirKg / 40;

    localStorage.setItem(APP_PREFIX + 'tuketim_arpa',  genelArpaKg);
    localStorage.setItem(APP_PREFIX + 'tuketim_misir', genelMisirTorba);
    localStorage.setItem(APP_PREFIX + 'tuketim_yem',   genelYemTorba);
    localStorage.setItem(APP_PREFIX + 'tuketim_soya',  genelSoyaKg);
    localStorage.setItem(APP_PREFIX + 'tuketim_saman', genelSamanKg);

    let genelSonucHTML = `
        <div class="genel-toplam">GENEL AHIR GÜNLÜK RASYON GİDERİ<br><span style="color:#c0392b;">Günlük: ${genelGider.toFixed(2)} TL | Aylık: ${(genelGider * 30).toFixed(2)} TL</span></div>
        <div class="tuketim-ozet">
            <strong style="color: #2c3e50; font-size: 14px;">GÜNLÜK / AYLIK TOPLAM TÜKETİM:</strong><br>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #f39c12; padding: 4px 0;"><span>Arpa:</span> <span><strong>${genelArpaKg.toFixed(1)} kg</strong>/Gün | <strong>${(genelArpaKg * 30).toFixed(0)} kg</strong>/Ay</span></div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #f39c12; padding: 4px 0;"><span>Mısır Flake:</span> <span><strong>${genelMisirTorba.toFixed(1)} Torba</strong>/Gün | <strong>${(genelMisirTorba * 30).toFixed(0)} Torba</strong>/Ay</span></div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #f39c12; padding: 4px 0;"><span>Fabrika Yemi:</span> <span><strong>${genelYemTorba.toFixed(1)} Torba</strong>/Gün | <strong>${(genelYemTorba * 30).toFixed(0)} Torba</strong>/Ay</span></div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #f39c12; padding: 4px 0;"><span>Soya Küspesi:</span> <span><strong>${genelSoyaKg.toFixed(1)} kg</strong>/Gün | <strong>${(genelSoyaKg * 30).toFixed(0)} kg</strong>/Ay</span></div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>Saman:</span> <span><strong>${genelSamanKg.toFixed(1)} kg</strong>/Gün | <strong>${(genelSamanKg * 30).toFixed(0)} kg</strong>/Ay</span></div>
        </div>
        <div style="margin-top: 15px;">
            <div class="kalem-maliyet"><span>Arpa Ezme Gideri:</span> <span>${genelArpaGider.toFixed(2)} TL/Gün | ${(genelArpaGider*30).toFixed(2)} TL/Ay</span></div>
            <div class="kalem-maliyet"><span>Mısır Flake Gideri:</span> <span>${genelMisirGider.toFixed(2)} TL/Gün | ${(genelMisirGider*30).toFixed(2)} TL/Ay</span></div>
            <div class="kalem-maliyet"><span>Fabrika Yemi Gideri:</span> <span>${genelYemGider.toFixed(2)} TL/Gün | ${(genelYemGider*30).toFixed(2)} TL/Ay</span></div>
            <div class="kalem-maliyet"><span>Soya Küspesi Gideri:</span> <span>${genelSoyaGider.toFixed(2)} TL/Gün | ${(genelSoyaGider*30).toFixed(2)} TL/Ay</span></div>
            <div class="kalem-maliyet"><span>Saman Gideri:</span> <span>${genelSamanGider.toFixed(2)} TL/Gün | ${(genelSamanGider*30).toFixed(2)} TL/Ay</span></div>
        </div>
    `;

    let genelAlan = document.getElementById('genelSonucAlani');
    if (genelGider > 0 || patokSayisi > 0) {
        genelAlan.innerHTML = genelSonucHTML;
        genelAlan.style.display = 'block';
    } else {
        genelAlan.style.display = 'none';
    }

    tumAlanlarıKaydet();
}

// STOK İŞLEMLERİ (Öncekiyle aynı)
function stokGoster() {
    let sArpa     = parseFloat(document.getElementById('stokArpa').value)  || 0;
    let arpaBirim = document.getElementById('stokArpaBirim').value;
    let sMisir    = parseFloat(document.getElementById('stokMisir').value) || 0;
    let sYem      = parseFloat(document.getElementById('stokYem').value)   || 0;
    let sSoya     = parseFloat(document.getElementById('stokSoya').value)  || 0;
    let sSaman    = parseFloat(document.getElementById('stokSaman').value) || 0;

    let gArpa  = parseFloat(localStorage.getItem(APP_PREFIX + 'tuketim_arpa'))  || 0;
    let gMisir = parseFloat(localStorage.getItem(APP_PREFIX + 'tuketim_misir')) || 0;
    let gYem   = parseFloat(localStorage.getItem(APP_PREFIX + 'tuketim_yem'))   || 0;
    let gSoya  = parseFloat(localStorage.getItem(APP_PREFIX + 'tuketim_soya'))  || 0;
    let gSaman = parseFloat(localStorage.getItem(APP_PREFIX + 'tuketim_saman')) || 0;

    localStorage.setItem(APP_PREFIX + 'stokArpa',      sArpa);
    localStorage.setItem(APP_PREFIX + 'stokMisir',     sMisir);
    localStorage.setItem(APP_PREFIX + 'stokYem',       sYem);
    localStorage.setItem(APP_PREFIX + 'stokSoya',      sSoya);
    localStorage.setItem(APP_PREFIX + 'stokSaman',     sSaman);
    localStorage.setItem(APP_PREFIX + 'stokArpaBirim', arpaBirim);

    let arpaTorbaKgVal = parseFloat(document.getElementById('arpaTorbaKg').value) || 43;
    let arpaKgOlarak   = (arpaBirim === 'torba') ? (sArpa * arpaTorbaKgVal) : sArpa;

    function bitisTarihiBul(stokMiktari, gunlukTuketim, isim) {
        let isimGuveli = escapeHTML(isim);
        if (stokMiktari <= 0) return `<div class="stok-kalem stok-kirmizi"><div><strong>${isimGuveli}</strong><br><span style="color:#e74c3c; font-size:12px;">Stokta hiç ürün yok!</span></div></div>`;
        if (gunlukTuketim <= 0) return `<div class="stok-kalem"><div><strong>${isimGuveli}</strong><br><span style="color:#7f8c8d; font-size:12px;">Rasyonda kullanılmıyor.</span></div></div>`;

        let kalanGun = Math.floor(stokMiktari / gunlukTuketim);
        let tarih = new Date();
        tarih.setDate(tarih.getDate() + kalanGun);
        let tarihMetni = tarih.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
        let sinif  = kalanGun <= 7 ? "stok-kirmizi" : "stok-yesil";
        let uyari  = kalanGun <= 7 ? " (Kritik Seviye)" : "";

        return `
            <div class="stok-kalem ${sinif}">
                <div>
                    <strong>${isimGuveli}</strong><span style="color:#e74c3c; font-size:11px;">${uyari}</span><br>
                    <span style="font-size:12px; color:#555;">Kalan: ${kalanGun} Gün</span>
                </div>
                <div style="text-align:right; font-size:13px; font-weight:bold; color:#2c3e50;">${tarihMetni}</div>
            </div>`;
    }

    let html = `
        ${bitisTarihiBul(arpaKgOlarak, gArpa,  "Arpa")}
        ${bitisTarihiBul(sMisir,        gMisir, "Mısır Flake")}
        ${bitisTarihiBul(sYem,          gYem,   "Fabrika Yemi")}
        ${bitisTarihiBul(sSoya,         gSoya,  "Soya Küspesi")}
        ${bitisTarihiBul(sSaman,        gSaman, "Saman")}
    `;
    let stokSonuc = document.getElementById('stokSonucAlani');
    if (stokSonuc) { stokSonuc.innerHTML = html; stokSonuc.style.display = 'block'; }
}

function saglikPatokGuncelle() {
    let select = document.getElementById('saglikPatokSec');
    if (!select) return;
    select.innerHTML = '';
    for (let i = 1; i <= patokSayisi; i++) {
        let option = document.createElement('option');
        option.value = String(i); option.text = 'Patok ' + i;
        select.appendChild(option);
    }
}
function saglikKaydet() {
    let pNo = document.getElementById('saglikPatokSec').value;
    let tarih = document.getElementById('saglikTarih').value;
    let ilac = document.getElementById('saglikIlac').value.trim();
    let doz = document.getElementById('saglikDoz').value.trim() || '-';
    if (!tarih || !ilac) { alert("Lütfen Tarih ve İlaç/Aşı Adı giriniz!"); return; }
    let kayitlar = JSON.parse(localStorage.getItem(APP_PREFIX + 'saglik')) || [];
    kayitlar.push({ id: Date.now(), patok: String(pNo), tarih: tarih, ilac: ilac, doz: doz });
    localStorage.setItem(APP_PREFIX + 'saglik', JSON.stringify(kayitlar));
    document.getElementById('saglikIlac').value = ''; document.getElementById('saglikDoz').value = '';
    saglikListele();
}
function saglikListele() {
    let kayitlar = JSON.parse(localStorage.getItem(APP_PREFIX + 'saglik')) || [];
    let gecmisDiv = document.getElementById('saglikGecmisi');
    if (!gecmisDiv) return;
    if (kayitlar.length === 0) { gecmisDiv.innerHTML = '<p style="text-align:center; color:#7f8c8d; font-size:13px;">Henüz kayıtlı bir aşı/ilaç bulunmuyor.</p>'; return; }
    kayitlar.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    let tablo = document.createElement('table'); tablo.className = 'saglik-tablo';
    tablo.innerHTML = `<tr><th>Patok</th><th>Tarih</th><th>İlaç/Aşı</th><th>Doz</th><th>İşlem</th></tr>`;
    kayitlar.forEach(k => {
        let tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>P-${escapeHTML(String(k.patok))}</strong></td><td>${escapeHTML(new Date(k.tarih).toLocaleDateString('tr-TR'))}</td><td>${escapeHTML(k.ilac)}</td><td>${escapeHTML(k.doz)}</td><td></td>`;
        let silBtn = document.createElement('button'); silBtn.type = 'button'; silBtn.className = 'btn-kucuk-sil'; silBtn.textContent = 'SİL';
        silBtn.addEventListener('click', function() { saglikSil(k.id); });
        tr.querySelector('td:last-child').appendChild(silBtn); tablo.appendChild(tr);
    });
    gecmisDiv.innerHTML = ''; gecmisDiv.appendChild(tablo);
}
function saglikSil(id) {
    if (!confirm("Bu sağlık kaydını silmek istediğinize emin misiniz?")) return;
    let kayitlar = JSON.parse(localStorage.getItem(APP_PREFIX + 'saglik')) || [];
    kayitlar = kayitlar.filter(k => k.id !== id);
    localStorage.setItem(APP_PREFIX + 'saglik', JSON.stringify(kayitlar));
    saglikListele();
}

function inekEkle() {
    let kupe = document.getElementById('inekKupe').value.trim();
    let laktasyon = document.getElementById('inekLaktasyon').value;
    let sut = document.getElementById('inekSut').value || 0;
    let durum = document.getElementById('inekDurum').value;
    if (!kupe) { alert("Sisteme kayıt için Küpe No veya İsim girmelisiniz!"); return; }
    let inekler = JSON.parse(localStorage.getItem(APP_PREFIX + 'inekler')) || [];
    let varMi = inekler.findIndex(i => i.kupe === kupe);
    if (varMi > -1) { inekler[varMi] = { kupe, laktasyon, sut: parseFloat(sut), durum }; } 
    else { inekler.push({ id: Date.now(), kupe, laktasyon, sut: parseFloat(sut), durum }); }
    localStorage.setItem(APP_PREFIX + 'inekler', JSON.stringify(inekler));
    document.getElementById('inekKupe').value = ''; document.getElementById('inekLaktasyon').value = ''; document.getElementById('inekSut').value = '';
    inekListele(); tohumlamaInekDoldur();
}
function inekListele() {
    let inekler = JSON.parse(localStorage.getItem(APP_PREFIX + 'inekler')) || [];
    let listeAlan = document.getElementById('inekListesiAlan'); let ozetAlan = document.getElementById('sutOzetAlan');
    if (inekler.length === 0) { listeAlan.innerHTML = '<p style="text-align:center; color:#7f8c8d; font-size:13px;">Sürüde henüz kayıtlı hayvan bulunmuyor.</p>'; ozetAlan.style.display = 'none'; return; }
    let toplamSut = 0, sagmalSayisi = 0;
    let tablo = document.createElement('table'); tablo.className = 'saglik-tablo'; tablo.style.minWidth = '500px';
    tablo.innerHTML = `<tr><th>Küpe / İsim</th><th>Laktasyon</th><th>Durum</th><th>Günlük Süt</th><th>İşlem</th></tr>`;
    inekler.forEach(inek => {
        if (inek.durum === 'Sağmal') { toplamSut += inek.sut; sagmalSayisi++; }
        let tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${escapeHTML(inek.kupe)}</strong></td><td>${escapeHTML(inek.laktasyon || '-')}</td><td>${escapeHTML(inek.durum)}</td><td><strong style="color:#27ae60;">${inek.durum === 'Sağmal' ? escapeHTML(String(inek.sut)) + ' Lt' : '-'}</strong></td><td></td>`;
        let silBtn = document.createElement('button'); silBtn.type = 'button'; silBtn.className = 'btn-kucuk-sil'; silBtn.textContent = 'SİL';
        silBtn.addEventListener('click', function() { inekSil(inek.kupe); });
        tr.querySelector('td:last-child').appendChild(silBtn); tablo.appendChild(tr);
    });
    listeAlan.innerHTML = ''; listeAlan.appendChild(tablo);
    let ortalama = sagmalSayisi > 0 ? (toplamSut / sagmalSayisi).toFixed(1) : 0;
    ozetAlan.innerHTML = `<strong>Sürü Süt Özeti:</strong> Toplam ${inekler.length} Baş Hayvan | Sağmal: ${sagmalSayisi} Baş <br> <strong>Toplam Günlük Süt: <span style="color:#27ae60; font-size:16px;">${toplamSut} Litre</span></strong> | İnek Başı Ort: ${ortalama} Lt`;
    ozetAlan.style.display = 'block';
}
function inekSil(kupe) {
    if (confirm(kupe + " numaralı hayvanı sürüden silmek istediğinize emin misiniz?")) {
        let inekler = JSON.parse(localStorage.getItem(APP_PREFIX + 'inekler')) || [];
        inekler = inekler.filter(i => i.kupe !== kupe);
        localStorage.setItem(APP_PREFIX + 'inekler', JSON.stringify(inekler));
        inekListele(); tohumlamaInekDoldur();
    }
}
function tohumlamaInekDoldur() {
    let inekler = JSON.parse(localStorage.getItem(APP_PREFIX + 'inekler')) || [];
    let select = document.getElementById('tohumlamaInekSec');
    if (!select) return;
    select.innerHTML = '';
    inekler.forEach(inek => {
        let opt = document.createElement('option'); opt.value = inek.kupe; opt.text = inek.kupe + (inek.durum === 'Sağmal' ? ' (Sağmal)' : ' (Kuru/Düve)'); select.appendChild(opt);
    });
}
function tohumlamaEkle() {
    let kupe = document.getElementById('tohumlamaInekSec').value;
    let tarih = document.getElementById('tohumTarihi').value;
    let sperma = document.getElementById('spermaKodu').value.trim();
    if (!kupe || !tarih) { alert("Lütfen inek seçip tohumlama tarihini giriniz!"); return; }
    let kayitlar = JSON.parse(localStorage.getItem(APP_PREFIX + 'tohumlama')) || [];
    kayitlar.push({ id: Date.now(), kupe, tarih, sperma });
    localStorage.setItem(APP_PREFIX + 'tohumlama', JSON.stringify(kayitlar));
    tohumlamaListele();
}
function tohumlamaListele() {
    let kayitlar = JSON.parse(localStorage.getItem(APP_PREFIX + 'tohumlama')) || [];
    let listeAlan = document.getElementById('tohumlamaListesiAlan');
    if (kayitlar.length === 0) { listeAlan.innerHTML = '<p style="text-align:center; color:#7f8c8d; font-size:13px;">Kayıtlı tohumlama bulunmuyor.</p>'; return; }
    kayitlar.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    let bugun = new Date(); bugun.setHours(0,0,0,0);
    let tablo = document.createElement('table'); tablo.className = 'saglik-tablo'; tablo.style.minWidth = '600px';
    tablo.innerHTML = `<tr><th>Küpe</th><th>Tohumlama</th><th>Boğa Kodu</th><th>Tahmini Doğum</th><th>Durum / Kalan Süre</th><th>İşlem</th></tr>`;
    kayitlar.forEach(k => {
        let tTarih = new Date(k.tarih); let dogumTarih = new Date(tTarih); dogumTarih.setDate(dogumTarih.getDate() + 283);
        let kalanGun = Math.round((dogumTarih - bugun) / (1000 * 60 * 60 * 24));
        let durumMetni = "", bgRenk = "";
        if (kalanGun < 0) { durumMetni = `<span style="color:#e74c3c; font-weight:bold;">Doğum Gerçekleşmiş Olmalı</span>`; } 
        else if (kalanGun <= 60) { durumMetni = `<span style="color:#d35400; font-weight:bold;">Kuruya Çıkar! (Kalan: ${kalanGun} Gün)</span>`; bgRenk = "background-color: #fdf2e9;"; } 
        else { durumMetni = `<span style="color:#2980b9;">Gebelik Devam (Kalan: ${kalanGun} Gün)</span>`; }
        let tr = document.createElement('tr'); tr.style.cssText = bgRenk;
        tr.innerHTML = `<td><strong>${escapeHTML(k.kupe)}</strong></td><td>${tTarih.toLocaleDateString('tr-TR')}</td><td>${escapeHTML(k.sperma || '-')}</td><td style="font-weight:bold; color:#8e44ad;">${dogumTarih.toLocaleDateString('tr-TR')}</td><td>${durumMetni}</td><td></td>`;
        let silBtn = document.createElement('button'); silBtn.type = 'button'; silBtn.className = 'btn-kucuk-sil'; silBtn.textContent = 'SİL';
        silBtn.addEventListener('click', function() { tohumlamaSil(k.id); });
        tr.querySelector('td:last-child').appendChild(silBtn); tablo.appendChild(tr);
    });
    listeAlan.innerHTML = ''; listeAlan.appendChild(tablo);
}
function tohumlamaSil(id) {
    if (confirm("Bu tohumlama kaydını silmek istediğinize emin misiniz?")) {
        let kayitlar = JSON.parse(localStorage.getItem(APP_PREFIX + 'tohumlama')) || [];
        kayitlar = kayitlar.filter(k => k.id !== id);
        localStorage.setItem(APP_PREFIX + 'tohumlama', JSON.stringify(kayitlar));
        tohumlamaListele();
    }
}
function giderEkle() {
    let tarih = document.getElementById('giderTarih').value; let kategori = document.getElementById('giderKategori').value;
    let aciklama = document.getElementById('giderAciklama').value.trim(); let tutar = parseFloat(document.getElementById('giderTutar').value);
    if (!tarih || !aciklama || isNaN(tutar) || tutar <= 0) { alert("Lütfen Tarih, Açıklama ve geçerli bir Tutar giriniz!"); return; }
    let giderler = JSON.parse(localStorage.getItem(APP_PREFIX + 'giderler')) || [];
    giderler.push({ id: Date.now(), tarih, kategori, aciklama, tutar });
    localStorage.setItem(APP_PREFIX + 'giderler', JSON.stringify(giderler));
    document.getElementById('giderAciklama').value = ''; document.getElementById('giderTutar').value = ''; giderListele();
}
function giderListele() {
    let giderler = JSON.parse(localStorage.getItem(APP_PREFIX + 'giderler')) || [];
    let listeAlan = document.getElementById('giderListesi'); let ozetAlan = document.getElementById('giderOzetAlani');
    if (giderler.length === 0) { listeAlan.innerHTML = '<p style="text-align:center; color:#7f8c8d; font-size:13px;">Henüz kaydedilmiş bir gider bulunmuyor.</p>'; ozetAlan.style.display = 'none'; return; }
    giderler.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    let toplamGider = 0;
    let tablo = document.createElement('table'); tablo.className = 'saglik-tablo'; tablo.style.minWidth = '500px';
    tablo.innerHTML = `<tr><th>Tarih</th><th>Kategori</th><th>Açıklama</th><th>Tutar</th><th>İşlem</th></tr>`;
    giderler.forEach(g => {
        toplamGider += g.tutar; let tr = document.createElement('tr');
        tr.innerHTML = `<td>${new Date(g.tarih).toLocaleDateString('tr-TR')}</td><td><strong>${escapeHTML(g.kategori)}</strong></td><td>${escapeHTML(g.aciklama)}</td><td style="color:#d35400; font-weight:bold;">${g.tutar.toLocaleString('tr-TR')} ₺</td><td></td>`;
        let silBtn = document.createElement('button'); silBtn.type = 'button'; silBtn.className = 'btn-kucuk-sil'; silBtn.textContent = 'SİL';
        silBtn.addEventListener('click', function() { giderSil(g.id); });
        tr.querySelector('td:last-child').appendChild(silBtn); tablo.appendChild(tr);
    });
    listeAlan.innerHTML = ''; listeAlan.appendChild(tablo);
    ozetAlan.innerHTML = `<strong>Çiftlik Toplam Gideri:</strong> <span style="color:#c0392b; font-size:18px;">${toplamGider.toLocaleString('tr-TR')} ₺</span>`; ozetAlan.style.display = 'block';
}
function giderSil(id) {
    if (confirm("Bu gider kalemini silmek istediğinize emin misiniz?")) {
        let giderler = JSON.parse(localStorage.getItem(APP_PREFIX + 'giderler')) || [];
        giderler = giderler.filter(g => g.id !== id); localStorage.setItem(APP_PREFIX + 'giderler', JSON.stringify(giderler)); giderListele();
    }
}
function damizlikRasyonHesapla() {
    let fSutYemi = (parseFloat(document.getElementById('fiyatSutYemi').value) || 0) / 50; 
    let fSilaj = (parseFloat(document.getElementById('fiyatSilaj').value) || 0) / 1000; 
    let fYonca = parseFloat(document.getElementById('fiyatYonca').value) || 0;
    let fArpa = parseFloat(document.getElementById('fiyatArpaDamizlik').value) || 0;
    let fSaman = parseFloat(document.getElementById('fiyatSamanDamizlik').value) || 0;
    let s = parseFloat(document.getElementById('d_sayi').value) || 0;
    let ortSut = parseFloat(document.getElementById('d_ortSut').value) || 0;
    let mSutYemi = parseFloat(document.getElementById('d_sutYemi').value) || 0;
    let mSilaj = parseFloat(document.getElementById('d_silaj').value) || 0;
    let mYonca = parseFloat(document.getElementById('d_yonca').value) || 0;
    let mArpa = parseFloat(document.getElementById('d_arpa').value) || 0;
    let mSaman = parseFloat(document.getElementById('d_saman').value) || 0;
    let hbMaliyet = (mSutYemi * fSutYemi) + (mSilaj * fSilaj) + (mYonca * fYonca) + (mArpa * fArpa) + (mSaman * fSaman);
    let suruMaliyet = hbMaliyet * s;
    let sutMaliyeti = (ortSut > 0) ? (hbMaliyet / ortSut) : 0;
    let sonucDiv = document.getElementById('sonuc_damizlikRasyon');
    if(s > 0 || hbMaliyet > 0) {
        sonucDiv.innerHTML = `<div><strong>Hayvan Başı Günlük Maliyet:</strong> <span style="color:#c0392b; font-size:16px;">${hbMaliyet.toFixed(2)} TL</span></div><div><strong>Sürü Günlük Rasyon Maliyeti:</strong> ${suruMaliyet.toFixed(2)} TL</div><div style="margin-top:8px; padding-top:8px; border-top:1px dashed #ccc;"><strong>1 Litre Sütün Yem Maliyeti:</strong> <span style="color:#27ae60; font-size:16px;">${sutMaliyeti.toFixed(2)} TL</span></div>`;
        sonucDiv.style.display = 'block';
    } else { sonucDiv.style.display = 'none'; }
}
function sutSatisKaydet() {
    let tarih = document.getElementById('sutSatisTarih').value;
    let toplamLt = parseFloat(document.getElementById('sutSatisToplam').value) || 0;
    let m_lt = parseFloat(document.getElementById('sutMandiraLt').value) || 0; let m_fiyat = parseFloat(document.getElementById('sutMandiraFiyat').value) || 0;
    let p_lt = parseFloat(document.getElementById('sutPerakendeLt').value) || 0; let p_fiyat = parseFloat(document.getElementById('sutPerakendeFiyat').value) || 0;
    if(!tarih || toplamLt <= 0) { alert("Lütfen tarih ve günlük toplam üretilen süt miktarını giriniz."); return; }
    let m_gelir = m_lt * m_fiyat; let p_gelir = p_lt * p_fiyat; let toplamGelir = m_gelir + p_gelir; let zayiat = toplamLt - (m_lt + p_lt);
    let kayitlar = JSON.parse(localStorage.getItem(APP_PREFIX + 'sutSatis')) || [];
    kayitlar.push({ id: Date.now(), tarih, toplamLt, m_lt, m_fiyat, m_gelir, p_lt, p_fiyat, p_gelir, toplamGelir, zayiat });
    localStorage.setItem(APP_PREFIX + 'sutSatis', JSON.stringify(kayitlar));
    document.getElementById('sutSatisToplam').value = ''; document.getElementById('sutMandiraLt').value = ''; document.getElementById('sutPerakendeLt').value = ''; sutSatisListele();
}
function sutSatisListele() {
    let kayitlar = JSON.parse(localStorage.getItem(APP_PREFIX + 'sutSatis')) || [];
    let listeAlan = document.getElementById('sutSatisListesi'); let ozetAlan = document.getElementById('sutSatisOzetAlani');
    if (kayitlar.length === 0) { listeAlan.innerHTML = '<p style="text-align:center; color:#7f8c8d; font-size:13px;">Henüz kaydedilmiş bir süt satışı bulunmuyor.</p>'; ozetAlan.style.display = 'none'; return; }
    kayitlar.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    let genelToplamGelir = 0, genelToplamLt = 0;
    let tablo = document.createElement('table'); tablo.className = 'saglik-tablo'; tablo.style.minWidth = '650px';
    tablo.innerHTML = `<tr><th>Tarih</th><th>Üretim (Lt)</th><th>Mandıra Geliri</th><th>Perakende Geliri</th><th>Toplam Gelir</th><th>İşlem</th></tr>`;
    kayitlar.forEach(k => {
        genelToplamGelir += k.toplamGelir; genelToplamLt += k.toplamLt;
        let tr = document.createElement('tr');
        tr.innerHTML = `<td>${new Date(k.tarih).toLocaleDateString('tr-TR')}</td><td><strong>${k.toplamLt} Lt</strong><br><span style="font-size:10px; color:#7f8c8d;">Zayiat: ${k.zayiat} Lt</span></td><td>${k.m_gelir.toLocaleString('tr-TR')} ₺ <br><span style="font-size:10px; color:#7f8c8d;">(${k.m_lt} Lt x ${k.m_fiyat} ₺)</span></td><td>${k.p_gelir.toLocaleString('tr-TR')} ₺ <br><span style="font-size:10px; color:#7f8c8d;">(${k.p_lt} Lt x ${k.p_fiyat} ₺)</span></td><td style="color:#27ae60; font-weight:bold;">${k.toplamGelir.toLocaleString('tr-TR')} ₺</td><td></td>`;
        let silBtn = document.createElement('button'); silBtn.type = 'button'; silBtn.className = 'btn-kucuk-sil'; silBtn.textContent = 'SİL';
        silBtn.addEventListener('click', function() { sutSatisSil(k.id); });
        tr.querySelector('td:last-child').appendChild(silBtn); tablo.appendChild(tr);
    });
    listeAlan.innerHTML = ''; listeAlan.appendChild(tablo);
    ozetAlan.innerHTML = `<strong>Kayıtlı Toplam Süt Satış Geliri:</strong> <span style="color:#27ae60; font-size:18px;">${genelToplamGelir.toLocaleString('tr-TR')} ₺</span> <br> <span style="font-size:12px; color:#7f8c8d;">(Toplam İşlenen Süt: ${genelToplamLt} Lt)</span>`;
    ozetAlan.style.display = 'block';
}
function sutSatisSil(id) {
    if (confirm("Bu süt satış kaydını silmek istediğinize emin misiniz?")) {
        let kayitlar = JSON.parse(localStorage.getItem(APP_PREFIX + 'sutSatis')) || [];
        kayitlar = kayitlar.filter(k => k.id !== id); localStorage.setItem(APP_PREFIX + 'sutSatis', JSON.stringify(kayitlar)); sutSatisListele();
    }
}
function sayaclariCalistir() {
    let bugun = new Date();
    let gunStr = bugun.toISOString().split('T')[0]; 
    let ayStr = gunStr.substring(0, 7); 
    let d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + 4 - (d.getDay()||7));
    let yilbasi = new Date(d.getFullYear(),0,1); let haftaStr = d.getFullYear() + '-W' + Math.ceil((((d - yilbasi)/86400000)+1)/7);

    if (localStorage.getItem('sayac_sonGun') !== gunStr) { localStorage.setItem('sayac_gunluk', '0'); localStorage.setItem('sayac_sonGun', gunStr); }
    if (localStorage.getItem('sayac_sonHafta') !== haftaStr) { localStorage.setItem('sayac_haftalik', '0'); localStorage.setItem('sayac_sonHafta', haftaStr); }
    if (localStorage.getItem('sayac_sonAy') !== ayStr) { localStorage.setItem('sayac_aylik', '0'); localStorage.setItem('sayac_sonAy', ayStr); }

    let tGun = parseInt(localStorage.getItem('sayac_gunluk')) || 0; let tHafta = parseInt(localStorage.getItem('sayac_haftalik')) || 0;
    let tAy = parseInt(localStorage.getItem('sayac_aylik')) || 0; let tTop = parseInt(localStorage.getItem('sayac_toplam')) || 0;

    if (!sessionStorage.getItem('oturumSayildi')) {
        tGun++; tHafta++; tAy++; tTop++;
        localStorage.setItem('sayac_gunluk', tGun); localStorage.setItem('sayac_haftalik', tHafta);
        localStorage.setItem('sayac_aylik', tAy); localStorage.setItem('sayac_toplam', tTop);
        sessionStorage.setItem('oturumSayildi', 'true');
    }
    if(document.getElementById('sayacGunluk')) document.getElementById('sayacGunluk').innerText = tGun;
    if(document.getElementById('sayacHaftalik')) document.getElementById('sayacHaftalik').innerText = tHafta;
    if(document.getElementById('sayacAylik')) document.getElementById('sayacAylik').innerText = tAy;
    if(document.getElementById('sayacToplam')) document.getElementById('sayacToplam').innerText = tTop;
}


// ─── KESİM & GEÇMİŞ MODÜLÜ İŞLEMLERİ ───────────────────────────────────────
function patokuKesimeGonder(pId) {
    let s = parseFloat(document.getElementById('p' + pId + '_sayi').value) || 0;
    if(s <= 0) { alert("Bu patokta kayıtlı hayvan bulunmuyor."); return; }

    let ckg = parseFloat(document.getElementById('p' + pId + '_kg').value) || 0;
    let karkasRandiman = parseFloat(document.getElementById('p' + pId + '_karkasRandiman').value) || 55;
    let etFiyati = parseFloat(document.getElementById('guncelEtFiyati').value) || 0;
    
    let tahminiKarkas = ckg * (karkasRandiman / 100);
    
    // Güncel maliyeti domdan çekiyoruz (Gizli attribute olarak finans sonucunda saklanıyordu)
    let finansSonucDiv = document.getElementById('finans_sonuc_p' + pId);
    let cMaliyet = 0;
    if(finansSonucDiv && finansSonucDiv.getAttribute('data-guncel-maliyet')) {
        cMaliyet = parseFloat(finansSonucDiv.getAttribute('data-guncel-maliyet'));
    } else {
        let aFiyat = parseFloat(document.getElementById('p' + pId + '_alisFiyati').value) || 0;
        cMaliyet = aFiyat; // Yem hesaplanamamışsa sadece alış fiyatını al
    }
    let toplamMaliyet = cMaliyet * s;

    document.getElementById('kesimModal_pId').value = pId;
    document.getElementById('kesimModal_islemTipi').value = 'patok_gonder';
    document.getElementById('kesimModal_hedefKayitId').value = '';
    
    document.getElementById('kesimModal_baslik').innerText = 'Patok ' + pId + ' Kesime Gönder';
    document.getElementById('kesimModal_isim').value = 'Patok ' + pId + ' Toplu Kesim';
    document.getElementById('alan_isim').style.display = 'block';
    document.getElementById('kesimModal_tarih').value = new Date().toISOString().split('T')[0];
    document.getElementById('kesimModal_sayi').value = s;
    document.getElementById('kesimModal_canli').value = ckg.toFixed(1);
    document.getElementById('kesimModal_karkas').value = tahminiKarkas.toFixed(1);
    document.getElementById('kesimModal_fiyat').value = etFiyati;
    document.getElementById('kesimModal_maliyet').value = Math.round(toplamMaliyet);

    document.getElementById('lbl_sayi').innerText = "Hayvan Sayısı";
    document.getElementById('lbl_maliyet').innerHTML = 'Toplam Maliyet (TL) <span style="font-size:10px; color:#7f8c8d;">(Mevcut Alış + Yem Gideri)</span>';

    document.getElementById('kesimModal').style.display = 'flex';
}

function yeniBagimsizKesimEkle() {
    document.getElementById('kesimModal_pId').value = '';
    document.getElementById('kesimModal_islemTipi').value = 'yeni';
    document.getElementById('kesimModal_hedefKayitId').value = '';
    
    document.getElementById('kesimModal_baslik').innerText = 'Geçmiş Kesim Kaydı Ekle';
    document.getElementById('alan_isim').style.display = 'block';
    document.getElementById('kesimModal_isim').value = 'Bağımsız Kesim';
    document.getElementById('kesimModal_tarih').value = new Date().toISOString().split('T')[0];
    
    ['sayi','canli','karkas','fiyat','maliyet'].forEach(id => document.getElementById('kesimModal_'+id).value = '');
    
    document.getElementById('lbl_sayi').innerText = "Hayvan Sayısı";
    document.getElementById('lbl_maliyet').innerHTML = 'Toplam Maliyet (TL) <span style="font-size:10px; color:#7f8c8d;">(Zarar/Kar hesabı için)</span>';

    document.getElementById('kesimModal').style.display = 'flex';
}

function kesimeHayvanEkle(kayitId) {
    document.getElementById('kesimModal_islemTipi').value = 'ekle';
    document.getElementById('kesimModal_hedefKayitId').value = kayitId;
    
    document.getElementById('kesimModal_baslik').innerText = 'Kesilen Gruba Ek Hayvan Dahil Et';
    document.getElementById('alan_isim').style.display = 'none';
    
    let bugunFormat = new Date().toISOString().split('T')[0];
    document.getElementById('kesimModal_tarih').value = bugunFormat;
    ['sayi','canli','karkas','fiyat','maliyet'].forEach(id => document.getElementById('kesimModal_'+id).value = '');

    document.getElementById('lbl_sayi').innerText = "Eklenecek Hayvan Sayısı";
    document.getElementById('lbl_maliyet').innerHTML = 'Bu Hayvanların Ek Maliyeti (TL)';

    document.getElementById('kesimModal').style.display = 'flex';
}

function kesimModalKaydet() {
    let islemTipi = document.getElementById('kesimModal_islemTipi').value;
    let hedefId = document.getElementById('kesimModal_hedefKayitId').value;
    let pId = document.getElementById('kesimModal_pId').value;

    let isim = document.getElementById('kesimModal_isim').value || "İsimsiz Kesim";
    let tarih = document.getElementById('kesimModal_tarih').value;
    let sayi = parseFloat(document.getElementById('kesimModal_sayi').value) || 0;
    let fiyat = parseFloat(document.getElementById('kesimModal_fiyat').value) || 0;
    let canli = parseFloat(document.getElementById('kesimModal_canli').value) || 0;
    let karkas = parseFloat(document.getElementById('kesimModal_karkas').value) || 0;
    let maliyet = parseFloat(document.getElementById('kesimModal_maliyet').value) || 0;

    if(sayi <= 0 || karkas <= 0 || fiyat <= 0) { alert("Lütfen sayı, karkas ağırlığı ve fiyat bilgilerini eksiksiz giriniz."); return; }

    let kayitlar = JSON.parse(localStorage.getItem(APP_PREFIX + 'kesimler')) || [];
    let toplamKarkas = sayi * karkas;
    let ciro = toplamKarkas * fiyat;
    let kar = ciro - maliyet;

    if (islemTipi === 'yeni' || islemTipi === 'patok_gonder') {
        kayitlar.push({ id: Date.now(), isim, tarih, sayi, canli, karkas, fiyat, maliyet, toplamKarkas, ciro, kar });

        if (islemTipi === 'patok_gonder' && pId) {
            let aktifCheckbox = document.getElementById('p'+pId+'_aktif');
            if(aktifCheckbox) { aktifCheckbox.checked = false; localStorage.setItem(APP_PREFIX + 'p' + pId + '_aktif', 'false'); }
            
            let sayiInput = document.getElementById('p'+pId+'_sayi');
            if(sayiInput) { sayiInput.value = 0; localStorage.setItem(APP_PREFIX + 'p' + pId + '_sayi', 0); }
            
            hesapla(); // Veriyi sıfırladıktan sonra panoyu yenile
            alert(`Tebrikler! Patok ${pId} başarıyla kesime gönderildi. \n(Not: Patok inaktif duruma alındı ve hayvan sayısı sıfırlandı.)`);
        } else {
            alert("Kesim kaydı başarıyla eklendi!");
        }
    } else if (islemTipi === 'ekle') {
        let r = kayitlar.find(k => String(k.id) === String(hedefId));
        if(r) {
            let yeniSayi = r.sayi + sayi;
            let yeniMaliyet = r.maliyet + maliyet;
            let yeniToplamKarkas = r.toplamKarkas + toplamKarkas;
            let yeniCiro = r.ciro + ciro;

            r.sayi = yeniSayi;
            r.maliyet = yeniMaliyet;
            r.toplamKarkas = yeniToplamKarkas;
            r.ciro = yeniCiro;
            r.kar = yeniCiro - yeniMaliyet;
            
            r.karkas = parseFloat((yeniToplamKarkas / yeniSayi).toFixed(1));
            if(r.canli > 0) r.canli = parseFloat((((r.canli * (r.sayi - sayi)) + (canli * sayi)) / yeniSayi).toFixed(1));
            r.fiyat = parseFloat((yeniCiro / yeniToplamKarkas).toFixed(2));
            
            r.tarih = tarih; // Son ekleme tarihini baz al
            alert("Hayvanlar gruba dahil edildi. Ortalamalar yeniden hesaplandı.");
        }
    }

    localStorage.setItem(APP_PREFIX + 'kesimler', JSON.stringify(kayitlar));
    document.getElementById('kesimModal').style.display = 'none';
    kesimListele();
}

function kesimListele() {
    let kayitlar = JSON.parse(localStorage.getItem(APP_PREFIX + 'kesimler')) || [];
    let listeAlan = document.getElementById('kesimListesiAlani');
    let ozetAlan = document.getElementById('kesimOzetAlani');

    if (kayitlar.length === 0) {
        listeAlan.innerHTML = '<p style="text-align:center; color:#7f8c8d; font-size:13px;">Sistemde henüz kayıtlı bir kesim bulunmuyor.</p>';
        ozetAlan.style.display = 'none';
        return;
    }

    kayitlar.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));

    let toplamCiroHesabi = 0;
    let toplamKarHesabi = 0;
    let toplamHayvan = 0;

    let tablo = document.createElement('table');
    tablo.className = 'saglik-tablo';
    tablo.style.minWidth = '800px';
    tablo.innerHTML = `<tr><th>Grup Adı</th><th>Tarih</th><th>Sayı & Kilo</th><th>Finansal Sonuç</th><th>İşlemler</th></tr>`;

    kayitlar.forEach(k => {
        toplamCiroHesabi += k.ciro;
        toplamKarHesabi += k.kar;
        toplamHayvan += k.sayi;

        let karRenk = k.kar >= 0 ? '#27ae60' : '#c0392b';
        let isaret = k.kar >= 0 ? '+' : '';

        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${escapeHTML(k.isim)}</strong></td>
            <td>${new Date(k.tarih).toLocaleDateString('tr-TR')}</td>
            <td style="line-height:1.4;">
                <span style="color:#2980b9; font-weight:bold;">${k.sayi} Baş</span><br>
                <span style="font-size:11px; color:#7f8c8d;">Ort. Karkas: ${k.karkas.toFixed(1)} kg</span><br>
                <span style="font-size:11px; color:#7f8c8d;">Fiyat: ${k.fiyat.toLocaleString('tr-TR')} ₺/kg</span>
            </td>
            <td style="line-height:1.4;">
                <span style="font-size:11px;">Ciro: ${k.ciro.toLocaleString('tr-TR')} ₺</span><br>
                <span style="font-weight:bold; color:${karRenk}; font-size:13px;">Net Kâr: ${isaret}${k.kar.toLocaleString('tr-TR')} ₺</span>
            </td>
            <td style="display:flex; flex-direction:column; gap:5px;"></td>
        `;

        let tdIslem = tr.querySelector('td:last-child');
        
        let ekleBtn = document.createElement('button');
        ekleBtn.type = 'button';
        ekleBtn.className = 'btn-kucuk-sil';
        ekleBtn.style.backgroundColor = '#8e44ad';
        ekleBtn.textContent = '+ HAYVAN EKLE';
        ekleBtn.addEventListener('click', function() { kesimeHayvanEkle(k.id); });
        tdIslem.appendChild(ekleBtn);

        let silBtn = document.createElement('button');
        silBtn.type = 'button';
        silBtn.className = 'btn-kucuk-sil';
        silBtn.textContent = 'KAYDI SİL';
        silBtn.addEventListener('click', function() { kesimSil(k.id); });
        tdIslem.appendChild(silBtn);

        tablo.appendChild(tr);
    });

    listeAlan.innerHTML = '';
    listeAlan.appendChild(tablo);

    let kRenk = toplamKarHesabi >= 0 ? '#27ae60' : '#c0392b';
    ozetAlan.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong>Toplam Kesilen:</strong> <span style="color:#2980b9;">${toplamHayvan} Baş</span><br>
                <strong>Toplam Elde Edilen Ciro:</strong> ${toplamCiroHesabi.toLocaleString('tr-TR')} ₺
            </div>
            <div style="text-align:right;">
                <strong>TOPLAM NET KÂR:</strong><br>
                <span style="color:${kRenk}; font-size:20px; font-weight:bold;">${toplamKarHesabi >= 0 ? '+' : ''}${toplamKarHesabi.toLocaleString('tr-TR')} ₺</span>
            </div>
        </div>
    `;
    ozetAlan.style.display = 'block';
}

function kesimSil(id) {
    if (confirm("Bu kesim kaydını silmek istediğinize emin misiniz? Bütün kâr/zarar raporu etkilenecektir.")) {
        let kayitlar = JSON.parse(localStorage.getItem(APP_PREFIX + 'kesimler')) || [];
        kayitlar = kayitlar.filter(k => k.id !== id);
        localStorage.setItem(APP_PREFIX + 'kesimler', JSON.stringify(kayitlar));
        kesimListele();
    }
}
