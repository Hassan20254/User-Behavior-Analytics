// Data collection and tracking system
class DataTracker {
    constructor() {
        this.data = {};
        this.startTime = Date.now();
        this.mouseMovements = [];
        this.clicks = [];
        this.scrollEvents = [];
        this.keyPresses = [];
        this.formInteractions = [];
        this.hoverElements = [];
        this.init();
    }

    init() {
        this.collectBasicData();
        this.setupEventListeners();
        this.startRealTimeTracking();
        this.getGeolocation();
        this.getBrowserFingerprint();
        this.checkVisitHistory();
        this.getBatteryInfo();
        this.detectFonts();
    }

    // الشبكة والجهاز (1-9)
    async collectBasicData() {
        // Get real IP and location data
        const ipData = await this.getIPData();
        
        const networkData = {
            '1. عنوان IP الخاص بك': ipData.ip || 'يتم جلبه من الخادم',
            '2. مزود خدمة الإنترنت (ISP)': ipData.isp || 'يتم تحديده من IP',
            '3. نوع الاتصال (واي فاي / بيانات)': navigator.connection ? navigator.connection.effectiveType : 'غير معروف',
            '4. سرعة الإنترنت التقريبية': navigator.connection ? navigator.connection.downlink + ' Mbps' : 'غير معروف',
            '5. نوع المتصفح وإصداره': navigator.userAgent,
            '6. نظام التشغيل وإصداره': this.getOS(),
            '7. نوع الجهاز (موبايل / لابتوب / تابلت)': this.getDeviceType(),
            '8. الشركة المصنعة للجهاز': navigator.userAgent.includes('iPhone') ? 'Apple' : 
                                             navigator.userAgent.includes('Samsung') ? 'Samsung' : 'غير محدد',
            '9. دقة الشاشة': `${screen.width} x ${screen.height}`
        };

        this.addData('networkDevice', networkData);
    }

    async getIPData() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return {
                ip: data.ip,
                isp: data.org,
                city: data.city,
                country: data.country_name,
                region: data.region,
                postal: data.postal
            };
        } catch (error) {
            return {
                ip: 'غير متاح',
                isp: 'غير متاح',
                city: 'غير متاح',
                country: 'غير متاح',
                region: 'غير متاح',
                postal: 'غير متاح'
            };
        }
    }

    // الموقع الجغرافي (10-16)
    async getGeolocation() {
        const ipData = await this.getIPData();
        
        const locationData = {
            '10. الدولة': ipData.country || 'يتم تحديده من IP',
            '11. المدينة': ipData.city || 'يتم تحديدها من IP',
            '12. المنطقة / الولاية': ipData.region || 'يتم تحديدها من IP',
            '13. المنطقة الزمنية': Intl.DateTimeFormat().resolvedOptions().timeZone,
            '14. الإحداثيات التقريبية من الـ IP': 'يتم جلبها من الخادم',
            '15. الرمز البريدي التقريبي': ipData.postal || 'يتم تحديده من IP',
            '16. لغة المتصفح': navigator.language
        };

        // Try to get actual geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    locationData['17. إحداثيات GPS الدقيقة'] = 
                        `${position.coords.latitude}, ${position.coords.longitude}`;
                    this.addData('location', locationData);
                },
                () => {
                    this.addData('location', locationData);
                }
            );
        } else {
            this.addData('location', locationData);
        }
    }

    // السلوك على الصفحة (17-24)
    setupEventListeners() {
        let scrollDepth = 0;
        let maxScrollDepth = 0;
        let scrollSpeed = 0;
        let lastScrollTime = Date.now();
        let lastScrollPosition = window.scrollY;

        // Scroll tracking
        window.addEventListener('scroll', () => {
            const currentTime = Date.now();
            const currentScroll = window.scrollY;
            const scrollDistance = Math.abs(currentScroll - lastScrollPosition);
            const timeDiff = currentTime - lastScrollTime;
            
            if (timeDiff > 0) {
                scrollSpeed = Math.round(scrollDistance / timeDiff * 1000);
            }

            scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);

            this.scrollEvents.push({
                depth: scrollDepth,
                speed: scrollSpeed,
                timestamp: currentTime
            });

            // Update scroll indicator
            const indicator = document.getElementById('scrollIndicator');
            if (indicator) {
                indicator.style.width = scrollDepth + '%';
            }

            lastScrollTime = currentTime;
            lastScrollPosition = currentScroll;
        });

        // Page load and time tracking
        window.addEventListener('load', () => {
            const behaviorData = {
                '17. الوقت الذي فتحت فيه الصفحة': new Date().toLocaleTimeString('ar-SA'),
                '18. المدة التي قضيتها في كل قسم': 'يتم تتبعها الآن',
                '19. أين توقف التمرير (scroll depth)': `${maxScrollDepth}%`,
                '20. سرعة التمرير': `${scrollSpeed} px/ثانية`,
                '21. الأجزاء التي تجاهلتها': 'يتم تحديدها من التمرير',
                '22. عدد مرات العودة للأعلى': this.scrollEvents.filter(e => e.direction === 'up').length,
                '23. آخر نقطة وصلت إليها قبل المغادرة': 'يتم تحديثها عند المغادرة',
                '24. هل قرأت المحتوى أم تخطيته': scrollDepth > 50 ? 'قرأ المحتوى' : 'تخطى المحتوى'
            };

            this.addData('behavior', behaviorData);
        });

        // Before unload - capture final data
        window.addEventListener('beforeunload', () => {
            const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
            this.updateBehaviorData(timeSpent, maxScrollDepth);
        });
    }

    // حركة الماوس واللمس (25-31)
    startRealTimeTracking() {
        let mouseX = 0, mouseY = 0;
        let mouseSpeed = 0;
        let lastMouseTime = Date.now();
        let lastMouseX = 0, lastMouseY = 0;
        let hoverStartTime = null;
        let currentHoverElement = null;

        // Mouse movement tracking
        document.addEventListener('mousemove', (e) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastMouseTime;
            
            if (timeDiff > 0) {
                const distance = Math.sqrt(
                    Math.pow(e.clientX - lastMouseX, 2) + 
                    Math.pow(e.clientY - lastMouseY, 2)
                );
                mouseSpeed = Math.round(distance / timeDiff * 1000);
            }

            mouseX = e.clientX;
            mouseY = e.clientY;

            this.mouseMovements.push({
                x: mouseX,
                y: mouseY,
                speed: mouseSpeed,
                timestamp: currentTime
            });

            // Update mouse tracker visual
            const tracker = document.getElementById('mouseTracker');
            if (tracker) {
                tracker.style.left = (mouseX - 10) + 'px';
                tracker.style.top = (mouseY - 10) + 'px';
                tracker.style.transform = `scale(${1 + mouseSpeed / 1000})`;
            }

            lastMouseTime = currentTime;
            lastMouseX = mouseX;
            lastMouseY = mouseY;
        });

        // Click tracking
        document.addEventListener('click', (e) => {
            this.clicks.push({
                x: e.clientX,
                y: e.clientY,
                target: e.target.tagName + (e.target.className ? '.' + e.target.className : ''),
                timestamp: Date.now()
            });

            // Check for frustration clicks (clicking on non-clickable elements)
            const isClickable = e.target.matches('a, button, input, select, textarea, [onclick], [role="button"]');
            if (!isClickable) {
                this.clicks[this.clicks.length - 1].frustration = true;
            }
        });

        // Hover tracking
        document.addEventListener('mouseover', (e) => {
            if (currentHoverElement !== e.target) {
                if (hoverStartTime && currentHoverElement) {
                    const hoverDuration = Date.now() - hoverStartTime;
                    this.hoverElements.push({
                        element: currentHoverElement.tagName + (currentHoverElement.className ? '.' + currentHoverElement.className : ''),
                        duration: hoverDuration,
                        timestamp: Date.now()
                    });
                }
                currentHoverElement = e.target;
                hoverStartTime = Date.now();
            }
        });

        // Touch events for mobile
        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const pressure = touch.force || touch.webkitForce || 1;
            this.mouseMovements.push({
                type: 'touch',
                x: touch.clientX,
                y: touch.clientY,
                pressure: pressure,
                timestamp: Date.now()
            });
        });

        document.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            const pressure = touch.force || touch.webkitForce || 1;
            this.mouseMovements.push({
                type: 'touch_move',
                x: touch.clientX,
                y: touch.clientY,
                pressure: pressure,
                timestamp: Date.now()
            });
        });

        // Update mouse/touch data periodically
        setInterval(() => {
            const mouseTouchData = {
                '25. مسار حركة الماوس الكامل': `${this.mouseMovements.length} نقطة مسجلة`,
                '26. سرعة حركة الماوس': `${mouseSpeed} px/ثانية`,
                '27. أين توقف الماوس طويلاً': this.hoverElements.length > 0 ? 
                    this.hoverElements[this.hoverElements.length - 1].element : 'لا يوجد',
                '28. عدد النقرات ومواضعها': `${this.clicks.length} نقرة`,
                '29. النقرات على أشياء غير قابلة للنقر': 
                    this.clicks.filter(c => c.frustration).length + ' نقرة إحباط',
                '30. حركات اللمس على الموبايل': 
                    this.mouseMovements.filter(m => m.type === 'touch').length + ' لمسة',
                '31. قوة الضغط على الشاشة': this.mouseMovements.filter(m => m.pressure && m.pressure > 1).length > 0 ? 
                    'يتم قياسها (' + Math.max(...this.mouseMovements.filter(m => m.pressure).map(m => m.pressure)).toFixed(2) + ')' : 'غير مدعومة'
            };

            this.addData('mouseTouch', mouseTouchData);
        }, 2000);
    }

    // الكتابة والنماذج (32-37)
    setupFormTracking() {
        let typingSpeed = 0;
        let keystrokes = [];
        let formStartTimes = {};

        document.addEventListener('keydown', (e) => {
            const currentTime = Date.now();
            keystrokes.push({
                key: e.key,
                timestamp: currentTime
            });

            // Calculate typing speed
            if (keystrokes.length > 1) {
                const timeDiff = currentTime - keystrokes[keystrokes.length - 2].timestamp;
                typingSpeed = Math.round(60000 / timeDiff); // characters per minute
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                if (!formStartTimes[e.target.name]) {
                    formStartTimes[e.target.name] = Date.now();
                }

                this.formInteractions.push({
                    field: e.target.name || e.target.tagName,
                    value: e.target.value,
                    timestamp: Date.now()
                });
            }
        });

        // Update typing data periodically
        setInterval(() => {
            const typingData = {
                '32. ما كتبته في حقول البحث': 'يتم تسجيله (لأغراض العرض فقط)',
                '33. ما حذفته وأعدت كتابته': 'يتم تتبع التعديلات',
                '34. سرعة الكتابة': `${typingSpeed} حرف/دقيقة`,
                '35. الأخطاء الإملائية التي صححتها': 'يتم تتبع التصحيحات',
                '36. الحقول التي فتحتها ثم تركتها فارغة': 
                    Object.keys(formStartTimes).length + ' حقل',
                '37. ترتيب تعبئة النموذج': 'يتم تسجيل الترتيب'
            };

            this.addData('typingForms', typingData);
        }, 3000);
    }

    // نظرة العين والاهتمام (38-42)
    setupAttentionTracking() {
        let attentionData = {
            '38. العناصر التي حومت عليها (hover)': this.hoverElements.length + ' عنصر',
            '39. الصور التي توقفت عندها': 'يتم تتبع التركيز على الصور',
            '40. الأسعار التي قرأتها أكثر من مرة': 'يتم تتبع القراءة المتكررة',
            '41. الأزرار التي اقتربت منها لكن ما ضغطت': 'يتم تتبع الاقتراب بدون نقرة',
            '42. المقارنات التي أجريتها بين المنتجات': 'يتم تتبع حركات المقارنة'
        };

        this.addData('attention', attentionData);
    }

    // مصدرك ومسارك (43-47)
    collectSourceData() {
        const sourceData = {
            '43. من أين جئت (Google / إعلان / رابط مشارك)': document.referrer || 'مباشر',
            '44. الكلمة التي بحثت عنها في Google': this.getSearchKeyword(),
            '45. الصفحة التي كنت عليها قبل هذه': document.referrer,
            '46. الصفحات التي زرتها بالترتيب': 'يتم تتبعها الآن',
            '47. الصفحة التي غادرت منها': 'سيتم تحديدها عند المغادرة'
        };

        this.addData('sourcePath', sourceData);
    }

    // بيانات المتصفح والجهاز (48-57)
    getBrowserFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser fingerprint', 2, 2);

        const browserData = {
            '48. اللغات المثبتة على المتصفح': navigator.languages.join(', '),
            '49. الإضافات (extensions) المثبتة': this.detectExtensions(),
            '50. هل أداة AdBlocker مفعلة': this.checkAdBlocker(),
            '52. بطاقة الشاشة (GPU)': this.getGPUInfo(),
            '53. عدد أنوية المعالج': navigator.hardwareConcurrency || 'غير معروف',
            '54. حجم ذاكرة الجهاز (تقريبي)': navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'غير معروف',
            '57. اتجاه الجهاز (عمودي / أفقي)': window.innerHeight > window.innerWidth ? 'عمودي' : 'أفقي'
        };

        this.addData('browserDevice', browserData);
    }

    // التتبع عبر الزيارات (58-64)
    checkVisitHistory() {
        const visitCount = localStorage.getItem('visitCount') || 0;
        const firstVisit = localStorage.getItem('firstVisit') || Date.now();
        const lastVisit = localStorage.getItem('lastVisit') || Date.now();

        localStorage.setItem('visitCount', parseInt(visitCount) + 1);
        localStorage.setItem('lastVisit', Date.now());
        if (!localStorage.getItem('firstVisit')) {
            localStorage.setItem('firstVisit', Date.now());
        }

        const visitData = {
            '58. عدد مرات زيارتك للموقع': parseInt(visitCount) + 1,
            '59. تاريخ أول زيارة لك': new Date(parseInt(firstVisit)).toLocaleDateString('ar-SA'),
            '60. المنتجات التي شاهدتها في زيارات سابقة': 'يتم تخزينها في localStorage',
            '61. ما وضعته في السلة ثم تركته': 'يتم تتبعه عبر الزيارات',
            '62. الفئات التي تهتم بها': 'يتم تحديدها من السلوك',
            '63. ساعات نشاطك المعتادة': new Date().getHours() + ':00',
            '64. أي جهاز تستخدمه أكثر': 'يتم مقارنة الأجهزة'
        };

        this.addData('visitTracking', visitData);
    }

    // تتبعك عبر مواقع أخرى (65-70)
    setupCrossSiteTracking() {
        const crossSiteData = {
            '65. المواقع الأخرى التي زرتها عبر pixels': 'يتم تتبعها عبر cookies',
            '66. اهتماماتك العامة المستنتجة من تصفحك': 'يتم تحليلها من السلوك',
            '67. فئتك العمرية التقريبية': 'يتم تخمينها من الاهتمامات',
            '68. مستوى دخلك التقريبي (مستنتج)': 'يتم تخمينه من المنتجات',
            '69. ما إذا كنت تتسوق أم تبحث فقط': 'يتم تحديده من السلوك',
            '70. احتمالية شرائك (purchase intent score)': 'يتم حسابها من التفاعل'
        };

        this.addData('crossSite', crossSiteData);
    }

    // Helper methods
    getOS() {
        const userAgent = navigator.userAgent;
        if (userAgent.indexOf('Win') !== -1) return 'Windows';
        if (userAgent.indexOf('Mac') !== -1) return 'MacOS';
        if (userAgent.indexOf('Linux') !== -1) return 'Linux';
        if (userAgent.indexOf('Android') !== -1) return 'Android';
        if (userAgent.indexOf('iOS') !== -1) return 'iOS';
        return 'غير معروف';
    }

    getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'موبايل';
        if (width < 1024) return 'تابلت';
        return 'لابتوب';
    }

    getSearchKeyword() {
        const referrer = document.referrer;
        if (referrer.includes('google.com/search')) {
            const match = referrer.match(/[?&]q=([^&]+)/);
            return match ? decodeURIComponent(match[1]) : 'غير محدد';
        }
        return 'غير محدد';
    }

    checkAdBlocker() {
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox';
        document.body.appendChild(testAd);
        const isBlocked = testAd.offsetHeight === 0;
        document.body.removeChild(testAd);
        return isBlocked ? 'مفعلة' : 'غير مفعلة';
    }

    detectExtensions() {
        const commonExtensions = [
            'chrome-extension://',
            'moz-extension://',
            'safari-extension://',
            'webext://'
        ];
        
        let detectedExtensions = 0;
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.src) {
                commonExtensions.forEach(ext => {
                    if (script.src.includes(ext)) {
                        detectedExtensions++;
                    }
                });
            }
        });
        
        // Check for common extension patterns
        const extensionPatterns = [
            'adblock', 'ublock', 'ghostery', 'noscript', 'privacy',
            'lastpass', '1password', 'grammarly', 'honey', 'rakuten'
        ];
        
        extensionPatterns.forEach(pattern => {
            if (navigator.userAgent.toLowerCase().includes(pattern) || 
                document.documentElement.outerHTML.toLowerCase().includes(pattern)) {
                detectedExtensions++;
            }
        });
        
        return detectedExtensions + ' إضافة تم الكشف عنها';
    }

    getGPUInfo() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
        }
        return 'غير معروف';
    }

    async getBatteryInfo() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                const batteryData = {
                    '55. مستوى شحن البطارية': Math.round(battery.level * 100) + '%',
                    '56. هل الجهاز يشحن الآن': battery.charging ? 'نعم' : 'لا'
                };
                this.addData('browserDevice', batteryData);
            } catch (error) {
                const batteryData = {
                    '55. مستوى شحن البطارية': 'غير مدعوم',
                    '56. هل الجهاز يشحن الآن': 'غير مدعوم'
                };
                this.addData('browserDevice', batteryData);
            }
        } else {
            const batteryData = {
                '55. مستوى شحن البطارية': 'غير مدعوم',
                '56. هل الجهاز يشحن الآن': 'غير مدعوم'
            };
            this.addData('browserDevice', batteryData);
        }
    }

    detectFonts() {
        const testFonts = [
            'Arial', 'Verdana', 'Times New Roman', 'Courier New', 
            'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
            'Trebuchet MS', 'Arial Black', 'Impact', 'Tahoma', 'Lucida Console'
        ];
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const text = 'mmmmmmmmmmlli';
        const baseSize = 72;
        
        const detectedFonts = [];
        testFonts.forEach(font => {
            ctx.font = `${baseSize}px '${font}', monospace`;
            const width = ctx.measureText(text).width;
            
            ctx.font = `${baseSize}px monospace`;
            const monoWidth = ctx.measureText(text).width;
            
            if (width !== monoWidth) {
                detectedFonts.push(font);
            }
        });
        
        const fontData = {
            '51. الخطوط المثبتة على جهازك': detectedFonts.length + ' خط تم الكشف عنه'
        };
        this.addData('browserDevice', fontData);
    }

    addData(category, data) {
        if (!this.data[category]) {
            this.data[category] = {};
        }
        Object.assign(this.data[category], data);
        this.updateDisplay(category);
        this.updateDataCount();
    }

    updateDisplay(category) {
        const container = document.getElementById(category);
        if (!container) return;

        container.innerHTML = '';
        Object.entries(this.data[category]).forEach(([key, value]) => {
            const item = document.createElement('div');
            item.className = 'data-item p-2 flex justify-between items-center';
            item.innerHTML = `
                <span class="text-gray-700 text-sm">${key}</span>
                <span class="text-gray-900 font-medium text-sm bg-gray-100 px-2 py-1 rounded">${value}</span>
            `;
            container.appendChild(item);
        });
    }

    updateDataCount() {
        let total = 0;
        Object.values(this.data).forEach(category => {
            total += Object.keys(category).length;
        });
        const counter = document.getElementById('dataCount');
        if (counter) {
            counter.textContent = total;
        }
    }

    updateBehaviorData(timeSpent, maxScrollDepth) {
        const updatedBehavior = {
            ...this.data['behavior'],
            '18. المدة التي قضيتها في كل قسم': `${timeSpent} ثانية`,
            '19. أين توقف التمرير (scroll depth)': `${maxScrollDepth}%`,
            '23. آخر نقطة وصلت إليها قبل المغادرة': `${maxScrollDepth}% من الصفحة`
        };
        this.data['behavior'] = updatedBehavior;
        this.updateDisplay('behavior');
    }

    exportData() {
        let total = 0;
        Object.values(this.data).forEach(category => {
            total += Object.keys(category).length;
        });
        
        const exportObj = {
            timestamp: new Date().toISOString(),
            totalDataPoints: total,
            data: this.data,
            statistics: {
                mouseMovements: this.mouseMovements.length,
                clicks: this.clicks.length,
                scrollEvents: this.scrollEvents.length,
                timeSpent: Math.round((Date.now() - this.startTime) / 1000)
            }
        };

        const dataStr = JSON.stringify(exportObj, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `tracking-data-${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

// Initialize the tracker when page loads
document.addEventListener('DOMContentLoaded', () => {
    const tracker = new DataTracker();
    
    // Make tracker globally available for export function
    window.dataTracker = tracker;
    
    // Initialize form tracking
    tracker.setupFormTracking();
    tracker.collectSourceData();
    tracker.setupAttentionTracking();
    tracker.setupCrossSiteTracking();
});

// Export function for the button
function exportData() {
    if (window.dataTracker) {
        window.dataTracker.exportData();
    }
}
