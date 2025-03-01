// ==UserScript==
// @name          Anime Player Otomatik Link Kaydedici (Havalı Silme + URL Türü)
// @namespace     http://tampermonkey.net/
// @version       1.4
// @description   iframe içindeki src değerini otomatik alır ve sol üstte gösterir. Link başı kaydırarak silme, havalı silme, URL türünü gösterme ve yapılandırılmış link listesi eklendi. Links are displayed as plain URLs.
// @author        everyone.exe
// @match         *://*.example.com/* Here comes the link to the anime site to be used, example *://*animecix.net/* stars are included!
// @grant         none
// ==/UserScript==

(function() {
    'use strict';

    let lastSavedLink = "";

    // Anime adını alma fonksiyonu
    function getAnimeName() {
        const url = window.location.pathname;
        const matches = url.match(/([^/]+)-\d+(?:-bolum|-episode)/i);
        if (matches) {
            const animeName = matches[1].replace(/-/g, ' ').trim();
            return animeName.replace(/\b\w/g, l => l.toUpperCase());
        }
        return "Unknown Anime";
    }

    // Bölüm bilgisini alma fonksiyonu
    function getBolumInfo() {
        const h3Elements = document.querySelectorAll('h3');
        for (const h3 of h3Elements) {
            const text = h3.textContent.toLowerCase();
            if (text.includes('bölüm') || text.includes('episode')) {
                return h3.textContent.trim();
            }
        }
        const url = window.location.pathname;
        const matches = url.match(/([^/]+)-(\d+)(?:-bolum|-episode)/i);
        if (matches) {
            const bolumNo = matches[2];
            return `${bolumNo}. Episode`;
        }
        return "Unknown Episode";
    }

    // Player türünü belirleme
    function getPlayerType(url) {
        if (url.includes('https://optraco.top/explorer/')) return 'Optraco';
        if (url.includes('https://odnoklassniki.ru/')) return 'OK.ru';
        if (url.includes('https://luffytra2.top/')) return 'LuffyTra';
        if (url.includes('https://video.sibnet.ru/')) return 'Sibnet';
        if (url.includes('https://vidmoly.to/')) return 'Vidmoly';
        if (url.includes('https://mega.nz/')) return 'Mega.nz';
        if (url.includes('https://drive.google.com')) return 'Google Drive';
        if (url.includes('https://www.dailymotion.com/')) return 'Dailymotion';
        if (url.includes('https://my.mail.ru/')) return 'Mail.ru';
        if (url.includes('https://hdvid.tv/')) return 'HDVid';
        return 'Unknown';
    }

    // Linki kaydetme fonksiyonu
    function saveLink(link) {
        link = link.trim();
        if (link === lastSavedLink) return;

        const bolumInfo = getBolumInfo();
        let links = JSON.parse(localStorage.getItem('savedPlayerLinks') || '[]');

        const linkObject = {
            url: link,
            bolum: bolumInfo,
            playerType: getPlayerType(link),
            timestamp: new Date().toISOString()
        };

        if (!links.some(item => item.url === link)) {
            links.push(linkObject); // Add new links to the end of the array
            localStorage.setItem('savedPlayerLinks', JSON.stringify(links));
            lastSavedLink = link;
            updateLinkDisplay();
        }
    }

    // iframe src'lerini tarama ve kaydetme
    function findAndSaveIframeSrc() {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const src = iframe.src;
            if (src && (
                src.includes('https://optraco.top/explorer/') ||
                src.includes('https://odnoklassniki.ru/') ||
                src.includes('https://luffytra2.top/') ||
                src.includes('https://video.sibnet.ru/') ||
                src.includes('https://vidmoly.to/') ||
                src.includes('https://mega.nz/') ||
                src.includes('https://drive.google.com') ||
                src.includes('https://www.dailymotion.com/') ||
                src.includes('https://my.mail.ru/') ||
                src.includes('https://hdvid.tv/')
            )) {
                saveLink(src);
            }
        });
    }

    // Linkleri görüntüleme ve düzenleme
    function updateLinkDisplay() {
        let links = JSON.parse(localStorage.getItem('savedPlayerLinks') || '[]');
        let linkContainer = document.getElementById('linkContainer');
        if (!linkContainer) {
            linkContainer = document.createElement('div');
            linkContainer.id = 'linkContainer';
            Object.assign(linkContainer.style, {
                position: 'fixed',
                top: '10px',
                left: '10px',
                background: 'rgba(0, 0, 0, 0.85)',
                color: 'white',
                padding: '15px',
                borderRadius: '10px',
                zIndex: '9999',
                maxWidth: '350px',
                maxHeight: '500px',
                overflowY: 'auto',
                fontFamily: 'Arial, sans-serif',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)'
            });
            document.body.appendChild(linkContainer);
        }

        linkContainer.innerHTML = 'Saved Links';

        // Tüm linkleri kopyala butonu
        const copyAllButton = document.createElement('button');
        copyAllButton.textContent = 'Copy All Links';
        Object.assign(copyAllButton.style, {
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 25px',
            marginBottom: '10px',
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '30px',
            transition: 'all 0.3s ease-in-out',
            display: 'block',
            width: '100%'
        });
        copyAllButton.onclick = () => {
            const allLinks = links.map(item => item.url).join('\n'); // Plain URLs
            navigator.clipboard.writeText(allLinks).then(() => alert('All links copied successfully!'));
        };
        linkContainer.appendChild(copyAllButton);

        // Tüm linkleri indir butonu
        const downloadAllButton = document.createElement('button');
        downloadAllButton.textContent = 'Download All Links';
        Object.assign(downloadAllButton.style, {
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 25px',
            marginBottom: '10px',
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '30px',
            transition: 'all 0.3s ease-in-out',
            display: 'block',
            width: '100%'
        });
        downloadAllButton.onclick = () => downloadAllLinks(getAnimeName());
        linkContainer.appendChild(downloadAllButton);

        // Sıfırla butonu (Havalı Silme)
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Delete All';
        Object.assign(resetButton.style, {
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 25px',
            marginBottom: '10px',
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '30px',
            transition: 'all 0.3s ease-in-out',
            display: 'block',
            width: '100%'
        });
        resetButton.onclick = () => deleteAllLinksWithAnimation();
        linkContainer.appendChild(resetButton);

        // Linkleri listeleme (yalnızca Copy butonu gösterilir)
        links.forEach((item, index) => {
            const linkDiv = document.createElement('div');
            linkDiv.classList.add('link-item');
            Object.assign(linkDiv.style, {
                marginTop: '10px',
                padding: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '5px',
                position: 'relative'
            });

            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copy'; // Button to copy the plain URL
            Object.assign(copyButton.style, {
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '5px 15px',
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '30px',
                width: '100%'
            });
            copyButton.onclick = () => {
                navigator.clipboard.writeText(item.url).then(() => alert('Link copied successfully!'));
            };
            linkDiv.appendChild(copyButton);

            linkContainer.appendChild(linkDiv);
        });
    }

    // Tüm linkleri indirme
    function downloadAllLinks(animeName) {
        const links = JSON.parse(localStorage.getItem('savedPlayerLinks') || '[]');
        const content = links.map(item => item.url).join('\n'); // Plain URLs
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${animeName}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Havalı animasyonlu silme (tüm linkler)
    function deleteAllLinksWithAnimation() {
        const linkContainer = document.getElementById('linkContainer');
        const links = linkContainer.querySelectorAll('.link-item');
        const savedLinks = JSON.parse(localStorage.getItem('savedPlayerLinks') || '[]');

        links.forEach((link, index) => {
            setTimeout(() => {
                link.style.animation = 'fadeOut 0.5s forwards';
                setTimeout(() => {
                    link.remove();
                    if (index === links.length - 1) {
                        localStorage.removeItem('savedPlayerLinks');
                        updateLinkDisplay();
                    }
                }, 500);
            }, index * 100);
        });
    }

    // Havalı animasyonlu silme (tek link)
    function deleteSingleLinkWithAnimation(index, linkDiv) {
        const savedLinks = JSON.parse(localStorage.getItem('savedPlayerLinks') || '[]');
        if (index >= 0 && index < savedLinks.length) {
            savedLinks.splice(index, 1);
            localStorage.setItem('savedPlayerLinks', JSON.stringify(savedLinks));

            linkDiv.style.animation = 'fadeOut 0.5s forwards';
            setTimeout(() => linkDiv.remove(), 500);

            updateLinkDisplay();
        }
    }

    // Dinamik içerik değişikliklerini izleme
    const observer = new MutationObserver(() => {
        findAndSaveIframeSrc();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Sayfa yüklendiğinde çalıştır
    window.addEventListener('load', () => {
        findAndSaveIframeSrc();
        updateLinkDisplay();
    });

    // Stil düzenlemesi
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }

        .link-item {
            transition: all 0.3s ease;
        }

        @media screen and (max-width: 768px) {
            #linkContainer {
                max-width: 90%;
                top: 20px;
                left: 5%;
                padding: 15px;
            }
            button {
                padding: 10px 20px;
                font-size: 14px;
            }
            h3 {
                font-size: 18px;
            }
        }
    `;
    document.head.appendChild(style);
})();
