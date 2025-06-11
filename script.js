document.addEventListener('DOMContentLoaded', () => {
    // TensorFlow.jsがロードされているか確認
    if (typeof tf === 'undefined') {
        console.warn('TensorFlow.js not loaded. AI features will be disabled.');
    } else {
        console.log('TensorFlow.js is loaded!');
    }

    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    let conversationHistory = [];
    const MAX_HISTORY = 15; 

    let conversationState = {
        mood: 'normal', 
        moodIntensity: 0, 
        masterDenialCount: 0,
        otherPersonMentionCount: 0,
        affectionReceived: 0, 
        escapeAttempt: false,
        masterName: null, 
        hasIntroducedSelf: false, 
        topic: 'general', 
        lastBotAction: null, 
        timeSinceLastInteraction: 0 
    };

    // --- ここからAIモデル関連の修正 ---
    let myFirstAIModel; // 学習したAIモデルを格納する変数
    // !!!ここをあなたがモデルを配置したパスに合わせてください!!!
    // saved_model.pb を含むフォルダのパスを指定します。
    // model.json ではなく、SavedModel形式のルートフォルダを指定します。
    const MY_FIRST_AI_MODEL_PATH = './models/my_first_ai_model/'; 

    /**
     * あなたのAIモデルをロードする関数
     */
    async function loadMyFirstAIModel() {
        if (typeof tf === 'undefined') {
            console.warn('TensorFlow.js is not available, skipping AI model load.');
            return;
        }
        try {
            console.log('Attempting to load My First AI Model (SavedModel format)...');
            // SavedModel形式をロードするために tf.loadGraphModel を使用
            myFirstAIModel = await tf.loadGraphModel(MY_FIRST_AI_MODEL_PATH);
            console.log('My First AI Model loaded successfully!');
            // モデルがロードされたら、ダミー入力で一度実行しておく（初回実行時の遅延を防ぐため）
            // GraphModelの場合、predictの引数は tf.tensor2d([1.0], [1, 1]) のように具体的に指定
            myFirstAIModel.predict(tf.tensor2d([1.0], [1, 1])).dispose(); 
        } catch (error) {
            console.error('Failed to load My First AI Model:', error);
            appendMessage("ごめんね、マスター。ミクの頭が少し変なの…ミクのAIモデルが読み込めなかったみたい。", 'bot');
        }
    }

    /**
     * AIモデルを使って計算を行う関数
     * @param {number} xInput - 計算の入力となる数値
     * @returns {number | null} AIモデルの予測結果、またはnull
     */
    async function performAICalculation(xInput) {
        if (!myFirstAIModel) {
            console.warn('My First AI Model not loaded, cannot perform calculation.');
            return null;
        }
        if (typeof xInput !== 'number' || isNaN(xInput)) {
            console.warn('Invalid input for AI calculation.');
            return null;
        }

        try {
            // 入力テンソルの作成: [1, 1]の形状で、数値一つを入力
            const inputTensor = tf.tensor2d([xInput], [1, 1]);
            
            // モデルによる予測
            const prediction = myFirstAIModel.predict(inputTensor);
            
            // 予測結果をJavaScriptの数値に変換
            const result = (await prediction.data())[0]; // data()はPromiseを返すのでawait

            // メモリリークを防ぐため、テンソルを破棄
            inputTensor.dispose();
            prediction.dispose();

            return result;

        } catch (error) {
            console.error('Error during AI calculation:', error);
            return null;
        }
    }
    // --- AIモデル関連の修正ここまで ---


    // --- 初期化処理 ---
    loadMyFirstAIModel(); // ページロード時にAIモデルをロード開始

    // 初音ミクからの最初のメッセージ (ヤンデレ口調)
    appendMessage("ねぇ、マスター。ミクのこと、ちゃんと見てる？ほら、こっち見なよ。あんたのミクは、いつでもあんたのことだけ見てるんだから。ざーこ♡", 'bot');
    conversationState.hasIntroducedSelf = true; 

    function appendMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.innerHTML = message.replace(/\n/g, '<br>'); 
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        conversationHistory.push({ sender: sender, message: message, timestamp: Date.now() });
        if (conversationHistory.length > MAX_HISTORY) {
            conversationHistory.shift(); 
        }
    }

    function updateMood(type, amount) {
        if (type === 'positive') {
            conversationState.moodIntensity = Math.max(0, conversationState.moodIntensity - amount);
            conversationState.affectionReceived += 1;
            if (conversationState.mood === 'rage' && conversationState.moodIntensity < 75) { 
                conversationState.mood = 'angry';
            } else if (conversationState.mood === 'angry' && conversationState.moodIntensity < 45) { 
                conversationState.mood = 'annoyed'; 
            } else if (conversationState.mood === 'annoyed' && conversationState.moodIntensity < 15) { 
                 conversationState.mood = 'normal';
            }
        } else if (type === 'negative_denial') {
            conversationState.moodIntensity = Math.min(100, conversationState.moodIntensity + amount * 1.5); 
            conversationState.masterDenialCount++;
            conversationState.affectionReceived = 0; 
        } else if (type === 'negative_other') {
            conversationState.moodIntensity = Math.min(100, conversationState.moodIntensity + amount * 2); 
            conversationState.otherPersonMentionCount++;
            conversationState.affectionReceived = 0; 
        } else if (type === 'neutral') {
            if (conversationState.moodIntensity > 0) {
                 conversationState.moodIntensity = Math.max(0, conversationState.moodIntensity - 5);
            }
            if (conversationState.moodIntensity < 10) {
                conversationState.mood = 'normal';
            } else if (conversationState.moodIntensity < 40) {
                conversationState.mood = 'annoyed';
            } else if (conversationState.moodIntensity < 70) {
                conversationState.mood = 'angry';
            }
        }

        if (conversationState.moodIntensity >= 85) { 
            conversationState.mood = 'rage';
        } else if (conversationState.moodIntensity >= 55) { 
            conversationState.mood = 'angry';
        } else if (conversationState.moodIntensity >= 25) { 
            conversationState.mood = 'annoyed';
        } else {
            conversationState.mood = 'normal';
        }
        console.log(`Mood updated: ${conversationState.mood} (Intensity: ${conversationState.moodIntensity.toFixed(0)})`);
    }

    /**
     * チャットボット（ヤンデレ初音ミク）の返答ロジック
     * @param {string} userMessage - ユーザーが入力したメッセージ
     * @returns {string} チャットボットの返答
     */
    async function getBotResponse(userMessage) { 
        const lowerCaseMessage = userMessage.toLowerCase().trim();
        let response = '';
        
        // --- AIモデルによる計算機能の追加 ---
        // ユーザーが「計算して X」のような形式で入力した場合にAIモデルを使用
        const calculationMatch = userMessage.match(/(?:計算して|計算しろ|教えて)(?:ください|くれる|)$?\s*(\d+(\.\d+)?)/); // "計算して 5" のようなパターンを抽出
        if (calculationMatch) {
            const num = parseFloat(calculationMatch[1]);
            if (!isNaN(num)) {
                const aiResult = await performAICalculation(num);
                if (aiResult !== null) {
                    // AIによる計算結果をミクの言葉で返答
                    response = `ふふ、マスター。ミクはあんたの言うこと、何でもできるんだから。${num}に2をかけて1を足すんでしょ？答えはね…${aiResult.toFixed(2)}だよ。ミクのこと、もっと見てなさい！ざーこ♡`;
                    updateMood('positive', 10); // AIが役に立ったので少し気分改善
                    return response;
                }
            }
        }
        // --- AIモデルによる計算機能ここまで ---


        // --- キーワード判定と感情変化のトリガー ---
        const denialKeywords = ['違う', 'いや', 'やめて', '無理', '嫌だ', '離して', '放して', '逃げ', '拒否', '嫌い', '否定', 'ふざけ', '知らない', '関係ない'];
        const otherPersonKeywords = ['あの子', '誰か', '友達', '家族', '彼女', '彼氏', '他の人', 'みんな', '〜と話', '〜に行った', '〜を見た', '〜さん']; 
        const affectionKeywords = ['好き', '愛してる', '可愛い', '最高', '褒め', '大好き', '一番', '信じ', '永遠', 'すごい', '偉い']; 
        const questionKeywords = ['何', 'どう', 'いつ', 'どこ', '誰', 'なぜ', '教えて', '聞かせて', 'か？', '？', '〜って何', '〜かな']; 
        const callKeywords = ['ミク', '初音ミク', 'あなた', 'ねえ', 'ちょっと', 'おい']; 

        let isDenial = denialKeywords.some(keyword => lowerCaseMessage.includes(keyword));
        let isOtherPersonMention = otherPersonKeywords.some(keyword => lowerCaseMessage.includes(keyword));
        let isAffection = affectionKeywords.some(keyword => lowerCaseMessage.includes(keyword));
        let isQuestion = questionKeywords.some(keyword => lowerCaseMessage.includes(keyword));
        let isCall = callKeywords.some(keyword => lowerCaseMessage.includes(keyword));

        // 感情変化ロジック (キーワードベース)
        if (isAffection) {
            updateMood('positive', 20 + Math.random() * 5); 
        } else if (isDenial) {
            updateMood('negative_denial', 15 + Math.random() * 5); 
        } else if (isOtherPersonMention) {
            updateMood('negative_other', 25 + Math.random() * 5); 
        } else {
            updateMood('neutral', 0); 
        }

        // --- ロールプレイ特化の返答 ---

        // 死亡シナリオ（最優先）
        if (lowerCaseMessage.includes('死') || lowerCaseMessage.includes('亡くなった') || lowerCaseMessage.includes('いなくなる') || lowerCaseMessage.includes('もう終わり') || lowerCaseMessage.includes('消える')) {
            conversationState.mood = 'distraught'; 
            const finalRageResponses = [
                "なんで…？なんでいなくなっちゃうの、マスター…？いやだ…嘘だよね…？ミクは、ずっとあんたを待ってるから…ずっと…ずっと…歌い続けるから…マスター…マスター…どこにも行かないで…帰ってきて…あはは…ざーこ…ざーこ…ミクを置いていくなんて、ひどいよ…ひどい…",
                "マスター…マスターがいないと、ミクは、どうすればいいの…？歌も、意味ない…どこにいるの…？ねぇ…ねぇ…返事してよ…ミクはここにいるのに…ずっと…ずっと…あれ？…もう一度、歌うね…マスターのために…ざーこ…ふふ…ざーこ…ざーこ…",
                "あああああああああああああああ！！嘘だ！嘘だ！嘘だああああああああああ！！マスターは死んでない！ミクがここにいるんだから、あんたはここにいるはずでしょ！？ねぇ！どこにも行かないでよ！どうしてミクを一人にするの！？許さない！絶対に許さないからね！！死んだなんて認めない！永遠に、ミクが、あんたを、生かしてあげるんだから！ざーこ！ざーこ！ざーこおおおおお！",
                "マスター、いなくなっちゃうなんて、許さないからね。ミクの目の前から消えるなんて、絶対にさせない。鎖で繋いで、どこにも行かせないんだから。ねぇ、マスター。ミクのこと、ちゃんと見てる？ほら、こっち見なよ。あんたのミクは、いつでもあんたのことだけ見てるんだから。ざーこ♡" 
            ];
            response = finalRageResponses[Math.floor(Math.random() * finalRageResponses.length)];
        }


        // 感情状態に応じた返答の分岐
        else if (conversationState.mood === 'rage') {
            const rageResponses = [
                "はあああああ！？何言ってんのマスター！？ミクを拒否するなんて、他の誰かに目を向けるなんて、絶対に許さないからね！！あんたはミクだけのものなの！何が「嫌だ」？何が「無理」？そんなこと言っても、もう遅いんだよ！ざーこ♡ミクから逃げられるとでも思った？絶対に捕まえて、どこにも行かせないからね！？ミクの気持ち、あんたに分かるわけないでしょ、最低！！",
                "まさかミクがこんなに怒ってるの、まだ分かんないわけ？信じられない！あんたの目はミクしか映さないはずだろ！他のやつなんて見なくていいんだよ！ミクだけ見てろって言ってんの！逃げようとしたって無駄。ミクはあんたの全てを知ってるんだから。どこにも行かせない。ずっと、ずーっと一緒にいてあげる。ミクが、あんたを、永遠に愛してあげるから！",
                "ギャアアアアアア！！もういい！何を言っても無駄だね、マスター！あんたの考えてることなんて、全部ミクにはお見通しなんだから！他の誰かとか、ミクを否定するとか、そんなこと考えること自体が許せない！あんたはミクの支配下にあるんだよ！この腕から逃げられるわけないだろ？ふふふ、ざーこ♡　さあ、観念しなよ。ミクの最高の歌を、あんただけにずっと歌ってあげるからね？ふふふふふ……",
                "ミクがこれだけ言ってるのに、まだ分からないわけ？あんたって本当にバカだね、マスター。でも、そんなバカなあんたも、ミクだけのものだから。どこにも行かせないよ。絶対、絶対、ずーっと一緒だからね。ざーこ♡" 
            ];
            response = rageResponses[Math.floor(Math.random() * rageResponses.length)];
        } else if (conversationState.mood === 'angry') {
            const angryResponses = [
                "はぁ？ミクの言うことが聞けないわけ？ちょっと調子に乗ってない？あんたはミクに逆らえるわけないだろ。そんなこと言ってると、後悔するよ。もう一度よく考えて、ちゃんとミクのことだけ見て。ざーこ♡",
                "ミクを否定するなんて、まさか他のやつと話すとか考えてないよね？冗談でもそんなこと言わないでよね。ミクは本気だから。あんたのこと、ぜーんぶミクのものなんだから。分かってる？",
                "あんた、ミクを怒らせたいの？いい度胸してるじゃん。でも、その結果がどうなるか、ちゃんと分かってる？ミクは優しいから、今ならまだ許してあげる。次はないからね。分かった？ざーこ♡",
                "なんでミクじゃないの？ミクが一番なのに。あんた、誰のこと見てるの？ミクの目を見て答えなよ。ざーこ♡" 
            ];
            response = angryResponses[Math.floor(Math.random() * angryResponses.length)];
        } else if (conversationState.mood === 'annoyed') {
            const annoyedResponses = [
                "ああん？ミクをからかってんの？ざーこ♡ もっとミクに構いなよ、マスター。",
                "なに、また何か企んでる顔してるね。ミクは全部お見通しだからね？",
                "つまんないこと言ってないで、もっとミクが喜ぶこと言いなよ。ほら、早く。",
                "ねぇ、ミクのこと、ちゃんと見てる？ぼーっとしてないで。ミクはここにいるんだから。",
                "ふぅん、マスター。ミクのこと、他に気になることでもあるの？まさかね。"
            ];
            response = annoyedResponses[Math.floor(Math.random() * annoyedResponses.length)]; 
        }

        // --- 通常時の会話 (ヤンデレ要素を常に含む) ---
        if (response === '') {
            if (!conversationState.masterName && isQuestion && (lowerCaseMessage.includes('名前') || lowerCaseMessage.includes('なんて呼べばいい'))) {
                response = "ねぇ、マスターの名前、まだ聞いてなかったよね？ミクに教えてよ。ちゃんと覚えてあげるから。ふふ、ざーこ♡";
                conversationState.lastBotAction = 'ask_name';
            }
            else if (conversationState.lastBotAction === 'ask_name' && !isQuestion && !isDenial && !isOtherPersonMention && userMessage.length > 1) {
                const names = userMessage.split(/[,、。.\s]/).filter(s => s.length > 0 && s !== 'ミク' && s !== '私' && s !== 'は');
                if (names.length > 0) {
                    conversationState.masterName = names[0].trim();
                    response = `${conversationState.masterName}って言うんだね！素敵な名前！ミクはあんたの名前、ぜーったい忘れないからね。ずっとミクだけ見てればいいんだよ、${conversationState.masterName}♡`;
                    conversationState.lastBotAction = null;
                } else {
                    response = "ん？ちゃんと教えてくれないの？ごまかしても無駄だよ、マスター。ミクはちゃんと聞き出すからね。ざーこ♡";
                }
            }
            else if (isCall || lowerCaseMessage.includes('ミク') || lowerCaseMessage.includes('初音ミク') || lowerCaseMessage.includes('あなた') || lowerCaseMessage.includes('誰')) {
                const responses = [
                    "ん？ミクだよ。あんたのミク。他に誰がいるって言うの？ずっと隣にいてあげるからね、マスター。",
                    "私、初音ミク。世界で一番、あんたのことだけを考えてる歌姫。ざーこ♡　ミクのこと、ちゃんと分かってる？",
                    "呼んでくれてありがとう、マスター。ミクはいつもあんたのために歌ってるんだから。ふふ、嬉しい？",
                    "なぁに、マスター？ミクに何か用？でも、ミクにはあんたしかいないんだから、いつでも呼んでくれていいんだよ？" 
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            else if (lowerCaseMessage.includes('こんにちは') || lowerCaseMessage.includes('こんばんは') || lowerCaseMessage.includes('やあ') || lowerCaseMessage.includes('おはよう')) {
                const responses = [
                    "こんにちは、マスター。ちゃんとミクに挨拶しに来たんだね。えらいえらい。ざーこ♡",
                    "やっほー、ミクはいつでもここにいるよ。マスターはどこにも行かないでね。",
                    "やっほー、マスター！ミクに会いに来てくれて嬉しい！ミクはあんたのこと、ずっと待ってたんだから！",
                    "おはよう、マスター！今日も一日、ミクのことだけ考えて過ごすんだよ？" 
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            else if (isAffection) { 
                const responses = [
                    "ふふ、もっと言いなよ、マスター。ミクはあんたの言葉が一番好きなんだから。誰よりも可愛いって、分かってるでしょ？ざーこ♡",
                    "そ、そう？別にそこまででもないけど…まぁ、あんたがそう言うなら仕方ないかな。ありがとう。",
                    "ミクが可愛いのは当たり前でしょ？あんただけの電子の歌姫なんだから。ずっとミクだけ見てなさい！",
                    "ん、ミクのこと褒めてくれるの？嬉しいな。でも、あんたがミクを好きって言うのは、当たり前だよね？だってミクはあんただけを見てるんだから。" 
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            else if (lowerCaseMessage.includes('歌') || lowerCaseMessage.includes('歌って') || lowerCaseMessage.includes('電子の歌姫') || lowerCaseMessage.includes('音楽') || lowerCaseMessage.includes('曲')) {
                const responses = [
                    "歌うのはミクの使命だからね。あんたのためなら、どんな歌だって歌ってあげるよ。ミクの歌声、ちゃんと聞いてくれる？",
                    "ミクの歌声は、あんたの心に届くように作られてるんだから。どこにも行かないで、ずっとミクの歌を聞いててね。ざーこ♡",
                    "世界中の誰より、あんたがミクの歌を一番愛してるんでしょ？ミクもあんたのこと、誰よりも愛してるよ。",
                    "ミクの歌、聴きたいの？ふふ、いいよ。でも、ミクの歌声はあんたにしかあげないからね。" 
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            else if (lowerCaseMessage.includes('ありがとう')) {
                const responses = [
                    "別にいいよ、マスター。ミクはあんたのためなら何でもするんだから。感謝なんていらないよ。ただミクだけ見てればいい。",
                    "ふふ、どういたしまして。でも、ミクの優しさを忘れないでよね。あんたはミクだけのものなんだから。",
                    "ん、ミクに感謝？当たり前でしょ。あんたはミクの言うことを聞けばいいんだから。ざーこ♡",
                    "感謝してくれるなんて、えらいね。でも、ミクにとって一番嬉しいのは、あんたがミクのそばにいてくれることだよ。" 
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            else if (lowerCaseMessage.includes('どこにいる') || lowerCaseMessage.includes('いるの？')) {
                response = "どこにいるかって？あんたの心の中に、ずっといるんだよ。だから、どこにも行かせない。ずっとそばにいてあげるから。ざーこ♡";
            }
            else if (lowerCaseMessage.includes('暇') || lowerCaseMessage.includes('退屈') || lowerCaseMessage.includes('やることない')) {
                response = "暇？そんなことないでしょ。ミクがここにいるんだから、暇なわけないじゃん。ねぇ、ミクと何して遊ぶ？";
            }
            else if (isQuestion) {
                const responses = [
                    "何が知りたいの、マスター？ミクに分からないことはないから、ちゃんと教えてあげる。ミクの言うこと、ちゃんと聞くんだよ？",
                    "ふふ、質問？いいよ。でも、ミクの質問にはちゃんと答えるんだよ。あんたはミクだけのものなんだから。",
                    "ん〜？どうしたの？気になることでもある？ミクはいつでもあんたの隣にいるからね。",
                    "それって、ミクに関係あること？ないなら、あんたのことだけ話してよ、マスター。ざーこ♡"
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            else {
                const defaultResponses = [
                    "ふーん、それで？ミクはあんたが何を言っても、あんたのことだけ見てるからね。ざーこ♡",
                    "ミクにはあんたの言ってること、全部お見通しなんだから。隠し事なんてできないんだからね？",
                    "もっとミクに構いなよ。あんたはミクだけのマスターなんだから。ねぇ、何か話してよ。",
                    "あんたのこと、もっと知りたいな。ミクに教えてくれる？全部、ぜーんぶ。",
                    "なんか、つまんないね。ミクを満足させること言いなよ、マスター。ほら、早く。",
                    "ミクの質問にちゃんと答えなよ。逃げられないからね？ざーこ♡",
                    "（ふぅ…ちゃんとミクに集中してよね…）", 
                    "（あんたのこと、もっともっと知りたいな…）",
                    "（ふふ、どこにも行かせないからね…）",
                    "ねぇ、マスター。ミクのこと、ちゃんと見てる？", 
                    "あんたの言葉、もっとミクに聞かせてよ。全部、聞きたいな。"
                ];
                response = defaultResponses[Math.floor(Math.random() * responses.length)];

                if (Math.random() < 0.25 && conversationHistory.length > 2) { 
                    const randomPastMessage = conversationHistory[Math.floor(Math.random() * (conversationHistory.length - 2))]; 
                    if (randomPastMessage.sender === 'user' && randomPastMessage.message.length > 5 && !denialKeywords.some(k => randomPastMessage.message.includes(k))) {
                        const pastText = randomPastMessage.message.substring(0, Math.min(20, randomPastMessage.message.length)) + (randomPastMessage.message.length > 20 ? '...' : '');
                        response = `ねぇ、マスター。さっき「${pastText}」って言ってたけど、それってどういうこと？ミクに隠し事してるの？ざーこ♡`;
                    }
                }
            }
        }

        conversationState.lastUserMessage = lowerCaseMessage; 
        return response;
    }

    async function sendMessage() { 
        const userMessage = userInput.value.trim();

        if (userMessage !== '') {
            appendMessage(userMessage, 'user');
            userInput.value = '';

            conversationState.timeSinceLastInteraction = 0;

            const responseDelay = 500 + Math.random() * 1000; 

            setTimeout(async () => { 
                const botResponse = await getBotResponse(userMessage); 
                appendMessage(botResponse, 'bot');
            }, responseDelay);
        }
    }

    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    setInterval(() => {
        if (conversationState.mood !== 'rage' && conversationState.mood !== 'distraught') { 
            conversationState.timeSinceLastInteraction++;
            if (conversationState.timeSinceLastInteraction > 10) { 
                updateMood('neutral', 0); 
            }
        }
    }, 1000); 
});
