‎const express = require("express");
‎const login = require("fca-project-orion");
‎const path = require("path");
‎
‎const app = express();
‎const port = process.env.PORT || 3000;
‎
‎app.use(express.json());
‎app.use(express.static(path.join(__dirname, "public")));
‎
‎// تمام چلنے والے بوٹس کا ڈیٹا یہاں محفوظ ہوگا
‎const activeBots = new Map();
‎
‎// بوٹ اسٹارٹ کرنے کا لنک (API)
‎app.post("/api/start-bot", (req, res) => {
‎    const { botName, prefix, ownerUID, appStateString } = req.body;
‎
‎    if (!botName || !prefix || !ownerUID || !appStateString) {
‎        return res.status(400).json({ success: false, error: "تمام معلومات فراہم کریں!" });
‎    }
‎
‎    try {
‎        // AppState ٹیکسٹ کو JSON فارمیٹ میں بدلنا
‎        const parsedAppState = JSON.parse(appStateString);
‎
‎        // اگر اس UID کا بوٹ پہلے سے چل رہا ہے تو اسے بند کریں
‎        if (activeBots.has(ownerUID)) {
‎            return res.json({ success: true, message: `${botName} پہلے سے ہی آن لائن ہے!` });
‎        }
‎
‎        // فیس بک لاگ ان شروع کریں
‎        login({ appState: parsedAppState }, (err, api) => {
‎            if (err) {
‎                console.error("Login Error for UID:", ownerUID, err);
‎                return res.status(500).json({ success: false, error: "فیس بک لاگ ان فیل ہو گیا۔ AppState چیک کریں۔" });
‎            }
‎
‎            api.setOptions({ listenEvents: true, selfListen: false });
‎            console.log(`[ ONLINE ] ${botName} (${ownerUID}) لائیو ہو گیا ہے!`);
‎
‎            // بوٹ کو ایکٹیو لسٹ میں ڈالیں
‎            activeBots.set(ownerUID, { botName, prefix, status: "Live 🟢", api });
‎
‎            // میسنجر کے میسجز سننے کا سسٹم
‎            api.listenMqtt((err, event) => {
‎                if (err) return console.error(err);
‎                if (event.type !== "message") return;
‎
‎                let message = event.body;
‎                if (!message) return;
‎
‎                if (message.startsWith(prefix)) {
‎                    const args = message.slice(prefix.length).trim().split(/ +/);
‎                    const commandName = args.shift().toLowerCase();
‎
‎                    // کمنڈز کے رپلائی
‎                    if (commandName === "acha") {
‎                        api.sendMessage(`جی اچھا! میں ${botName} ہوں اور سب ٹھیک ٹھاک ہے۔`, event.threadID, event.messageID);
‎                    }
‎                    if (commandName === "uid") {
‎                        api.sendMessage(`آپ کی فیس بک UID یہ ہے: ${event.senderID}`, event.threadID, event.messageID);
‎                    }
‎                }
‎            });
‎        });
‎
‎        return res.json({ success: true, message: `${botName} کامیابی سے اسٹارٹ ہو رہا ہے...` });
‎
‎    } catch (e) {
‎        return res.status(400).json({ success: false, error: "AppState کا فارمیٹ درست نہیں ہے (JSON ہونا چاہیے)۔" });
‎    }
‎});
‎
‎// لائیو بوٹس کی لسٹ دیکھنے کی API
‎app.get("/api/active-bots", (req, res) => {
‎    const list = [];
‎    activeBots.forEach((value, key) => {
‎        list.push({
‎            ownerUID: key,
‎            botName: value.botName,
‎            prefix: value.prefix,
‎            status: value.status
‎        });
‎    });
‎    res.json(list);
‎});
‎
‎app.listen(port, () => {
‎    console.log(`[ SERVER ] ویب سائٹ پورٹ ${port} پر لائیو ہے!`);
‎});
