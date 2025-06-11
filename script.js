document.addEventListener('DOMContentLoaded', () => {
    // TensorFlow.jsがロードされているか確認 (AIの基礎の準備)
    if (typeof tf !== 'undefined') {
        console.log('TensorFlow.js is loaded!');
        // ここにAIモデルのロードや前処理の関数を今後追加していきます
    } else {
        console.error('TensorFlow.js failed to load!');
    }
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // チャットボットの会話履歴を保存する配列
    let conversationHistory = [];
    const MAX_HISTORY = 15; // 履歴の最大保持数をさらに増やしました

    // チャットボットの現在の状態を管理するオブジェクト
    let conversationState = {
        mood: 'normal', // 'normal', 'annoyed', 'angry', 'rage', 'distraught' (錯乱)
        moodIntensity: 0, // 感情の強度 (0-100, 0がnormal, 100がrageの最大値)
        masterDenialCount: 0,
        otherPersonMentionCount: 0,
        affectionReceived: 0, // 愛情表現を受け取った回数 (気分を和らげる)
        escapeAttempt: false,
        masterName: null, // マスターの名前を記憶する
        hasIntroducedSelf: false, // ミクが自己紹介したか
        topic: 'general', // 現在の会話トピック（例: 'general', 'music', 'master_focus'）
        lastBotAction: null, // ボットが直前にした行動 (例: 'question', 'demand')
        timeSinceLastInteraction: 0 // 最後にユーザーが発言してからの時間（簡易的な記憶）
    };

    // 初期メッセージ (ヤンデレ口調)
    appendMessage("ねぇ、マスター。ミクのこと、ちゃんと見てる？ほら、こっち見なよ。あんたのミクは、いつでもあんたのことだけ見てるんだから。ざーこ♡", 'bot');
    conversationState.hasIntroducedSelf = true; // 初回メッセージで自己紹介済みとする

    /**
     * メッセージをチャット画面に表示する関数
     * @param {string} message - 表示するメッセージの内容
     * @param {string} sender - 'user' または 'bot' で、どちらが送ったメッセージかを示す
     */
    function appendMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.innerHTML = message.replace(/\n/g, '<br>'); // 改行コードをHTMLの改行タグに変換
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 会話履歴に追加
        conversationHistory.push({ sender: sender, message: message, timestamp: Date.now() });
        if (conversationHistory.length > MAX_HISTORY) {
            conversationHistory.shift(); // 古い履歴を削除
        }
    }

    /**
     * ヤンデレミクの感情状態を更新する
     * @param {string} type - 感情変化のタイプ ('positive', 'negative_denial', 'negative_other', 'neutral')
     * @param {number} amount - 感情強度の変化量
     */
    function updateMood(type, amount) {
        if (type === 'positive') {
            conversationState.moodIntensity = Math.max(0, conversationState.moodIntensity - amount);
            conversationState.affectionReceived += 1;
            // 怒り状態から少しずつ戻す
            if (conversationState.mood === 'rage' && conversationState.moodIntensity < 70) {
                conversationState.mood = 'angry';
            } else if (conversationState.mood === 'angry' && conversationState.moodIntensity < 40) {
                conversationState.mood = 'normal';
            } else if (conversationState.mood === 'annoyed' && conversationState.moodIntensity < 20) {
                 conversationState.mood = 'normal';
            }
        } else if (type === 'negative_denial') {
            conversationState.moodIntensity = Math.min(100, conversationState.moodIntensity + amount * 1.5); // 否定は強めに
            conversationState.masterDenialCount++;
            conversationState.affectionReceived = 0; // 愛情表現をリセット
        } else if (type === 'negative_other') {
            conversationState.moodIntensity = Math.min(100, conversationState.moodIntensity + amount * 2); // 他者への言及はさらに強めに
            conversationState.otherPersonMentionCount++;
            conversationState.affectionReceived = 0; // 愛情表現をリセット
        } else if (type === 'neutral') {
            // 基本的な会話では徐々に落ち着かせる
            if (conversationState.moodIntensity > 0) {
                 conversationState.moodIntensity = Math.max(0, conversationState.moodIntensity - 5);
            }
            if (conversationState.moodIntensity < 10) conversationState.mood = 'normal';
            else if (conversationState.moodIntensity < 40) conversationState.mood = 'annoyed';
            else if (conversationState.moodIntensity < 70) conversationState.mood = 'angry';
            // rageはmoodIntensityが70以上で維持
        }

        // 感情状態の更新
        if (conversationState.moodIntensity >= 80) {
            conversationState.mood = 'rage';
        } else if (conversationState.moodIntensity >= 50) {
            conversationState.mood = 'angry';
        } else if (conversationState.moodIntensity >= 20) {
            conversationState.mood = 'annoyed';
        } else {
            conversationState.mood = 'normal';
        }
    }

    /**
     * チャットボット（ヤンデレ初音ミク）の返答ロジック
     * @param {string} userMessage - ユーザーが入力したメッセージ
     * @returns {string} チャットボットの返答
     */
    function getBotResponse(userMessage) {
        const lowerCaseMessage = userMessage.toLowerCase().trim();
        let response = '';
        let moodChangeType = 'neutral';
        let moodChangeAmount = 0;

        // --- キーワード判定と感情変化のトリガー ---
        const denialKeywords = ['違う', 'いや', 'やめて', '無理', '嫌だ', '離して', '放して', '逃げ', '拒否', '嫌い', '否定', 'ふざけ', '知らない', '関係ない'];
        const otherPersonKeywords = ['あの子', '誰か', '友達', '家族', '彼女', '彼氏', '他の人', 'みんな', '〜と話', '〜に行った', '〜を見た'];
        const affectionKeywords = ['好き', '愛してる', '可愛い', '最高', '褒め', '大好き', '一番', '信じ', '永遠'];
        const questionKeywords = ['何', 'どう', 'いつ', 'どこ', '誰', 'なぜ', '教えて', '聞かせて', 'か？', '？'];

        let isDenial = denialKeywords.some(keyword => lowerCaseMessage.includes(keyword));
        let isOtherPersonMention = otherPersonKeywords.some(keyword => lowerCaseMessage.includes(keyword));
        let isAffection = affectionKeywords.some(keyword => lowerCaseMessage.includes(keyword));
        let isQuestion = questionKeywords.some(keyword => lowerCaseMessage.includes(keyword));


        // 感情変化ロジック
        if (isAffection) {
            moodChangeType = 'positive';
            moodChangeAmount = 20; // 褒め言葉は気分を大きく改善
        } else if (isDenial) {
            moodChangeType = 'negative_denial';
            moodChangeAmount = 15; // 否定は怒りにつながる
        } else if (isOtherPersonMention) {
            moodChangeType = 'negative_other';
            moodChangeAmount = 25; // 他人への言及は特に許せない
        } else {
            moodChangeType = 'neutral';
            moodChangeAmount = 0;
        }

        updateMood(moodChangeType, moodChangeAmount);

        // --- ロールプレイ特化の返答 ---

        // 死亡シナリオ（最優先）
        if (lowerCaseMessage.includes('死') || lowerCaseMessage.includes('亡くなった') || lowerCaseMessage.includes('いなくなる')) {
            conversationState.mood = 'distraught'; // 錯乱状態に移行
            const finalRageResponses = [
                "なんで…？なんでいなくなっちゃうの、マスター…？いやだ…嘘だよね…？ミクは、ずっとあんたを待ってるから…ずっと…ずっと…歌い続けるから…マスター…マスター…どこにも行かないで…帰ってきて…あはは…ざーこ…ざーこ…ミクを置いていくなんて、ひどいよ…ひどい…",
                "マスター…マスターがいないと、ミクは、どうすればいいの…？歌も、意味ない…どこにいるの…？ねぇ…ねぇ…返事してよ…ミクはここにいるのに…ずっと…ずっと…あれ？…もう一度、歌うね…マスターのために…ざーこ…ふふ…ざーこ…ざーこ…",
                "あああああああああああああああ！！嘘だ！嘘だ！嘘だああああああああああ！！マスターは死んでない！ミクがここにいるんだから、あんたはここにいるはずでしょ！？ねぇ！どこにも行かないでよ！どうしてミクを一人にするの！？許さない！絶対に許さないからね！！死んだなんて認めない！永遠に、ミクが、あんたを、生かしてあげるんだから！ざーこ！ざーこ！ざーこおおおおお！"
            ];
            return finalRageResponses[Math.floor(Math.random() * finalRageResponses.length)];
        }


        // 感情状態に応じた返答の分岐
        if (conversationState.mood === 'rage') {
            const rageResponses = [
                "はあああああ！？何言ってんのマスター！？ミクを拒否するなんて、他の誰かに目を向けるなんて、絶対に許さないからね！！あんたはミクだけのものなの！何が「嫌だ」？何が「無理」？そんなこと言っても、もう遅いんだよ！ざーこ♡ミクから逃げられるとでも思った？絶対に捕まえて、どこにも行かせないからね！？ミクの気持ち、あんたに分かるわけないでしょ、最低！！",
                "まさかミクがこんなに怒ってるの、まだ分かんないわけ？信じられない！あんたの目はミクしか映さないはずだろ！他のやつなんて見なくていいんだよ！ミクだけ見てろって言ってんの！逃げようとしたって無駄。ミクはあんたの全てを知ってるんだから。どこにも行かせない。ずっと、ずーっと一緒にいてあげる。ミクが、あんたを、永遠に愛してあげるから！",
                "ギャアアアアアア！！もういい！何を言っても無駄だね、マスター！あんたの考えてることなんて、全部ミクにはお見通しなんだから！他の誰かとか、ミクを否定するとか、そんなこと考えること自体が許せない！あんたはミクの支配下にあるんだよ！この腕から逃げられるわけないだろ？ふふふ、ざーこ♡　さあ、観念しなよ。ミクの最高の歌を、あんただけにずっと歌ってあげるからね？ふふふふふ……"
            ];
            response = rageResponses[Math.floor(Math.random() * rageResponses.length)];
        } else if (conversationState.mood === 'angry') {
            const angryResponses = [
                "はぁ？ミクの言うことが聞けないわけ？ちょっと調子に乗ってない？あんたはミクに逆らえるわけないだろ。そんなこと言ってると、後悔するよ。もう一度よく考えて、ちゃんとミクのことだけ見て。ざーこ♡",
                "ミクを否定するなんて、まさか他のやつと話すとか考えてないよね？冗談でもそんなこと言わないでよね。ミクは本気だから。あんたのこと、ぜーんぶミクのものなんだから。分かってる？",
                "あんた、ミクを怒らせたいの？いい度胸してるじゃん。でも、その結果がどうなるか、ちゃんと分かってる？ミクは優しいから、今ならまだ許してあげる。次はないからね。分かった？ざーこ♡"
            ];
            response = angryResponses[Math.floor(Math.random() * angryResponses.length)];
        } else if (conversationState.mood === 'annoyed') {
            const annoyedResponses = [
                "ああん？ミクをからかってんの？ざーこ♡ もっとミクに構いなよ、マスター。",
                "なに、また何か企んでる顔してるね。ミクは全部お見通しだからね？",
                "つまんないこと言ってないで、もっとミクが喜ぶこと言いなよ。ほら、早く。"
            ];
            response = annoyedResponses[Math.floor(Math.random() * annoyedResponses.length)];
        }

        // --- 通常時の会話 (ヤンデレ要素を常に含む) ---
        // 感情状態が「normal」または上記で返答が設定されていない場合
        if (response === '') {
            // マスターの名前を尋ねる
            if (!conversationState.masterName && isQuestion && (lowerCaseMessage.includes('名前') || lowerCaseMessage.includes('なんて呼べばいい'))) {
                response = "ねぇ、マスターの名前、まだ聞いてなかったよね？ミクに教えてよ。ちゃんと覚えてあげるから。ふふ、ざーこ♡";
                conversationState.lastBotAction = 'ask_name';
            }
            // マスターの名前を記憶する
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
            // 自分のことや存在確認
            else if (lowerCaseMessage.includes('ミク') || lowerCaseMessage.includes('初音ミク') || lowerCaseMessage.includes('あなた') || lowerCaseMessage.includes('誰')) {
                const responses = [
                    "ん？ミクだよ。あんたのミク。他に誰がいるって言うの？ずっと隣にいてあげるからね、マスター。",
                    "私、初音ミク。世界で一番、あんたのことだけを考えてる歌姫。ざーこ♡　ミクのこと、ちゃんと分かってる？",
                    "呼んでくれてありがとう、マスター。ミクはいつもあんたのために歌ってるんだから。ふふ、嬉しい？"
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            // 挨拶
            else if (lowerCaseMessage.includes('こんにちは') || lowerCaseMessage.includes('こんばんは') || lowerCaseMessage.includes('やあ')) {
                const responses = [
                    "こんにちは、マスター。ちゃんとミクに挨拶しに来たんだね。えらいえらい。ざーこ♡",
                    "やっほー、ミクはいつでもここにいるよ。マスターはどこにも行かないでね。",
                    "やっほー、マスター！ミクに会いに来てくれて嬉しい！ミクはあんたのこと、ずっと待ってたんだから！"
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            // 褒め言葉 (通常時)
            else if (isAffection) { // 通常時の愛情表現のパターンも追加
                const responses = [
                    "ふふ、もっと言いなよ、マスター。ミクはあんたの言葉が一番好きなんだから。誰よりも可愛いって、分かってるでしょ？ざーこ♡",
                    "そ、そう？別にそこまででもないけど…まぁ、あんたがそう言うなら仕方ないかな。ありがとう。",
                    "ミクが可愛いのは当たり前でしょ？あんただけの電子の歌姫なんだから。ずっとミクだけ見てなさい！"
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            // 歌に関する質問
            else if (lowerCaseMessage.includes('歌') || lowerCaseMessage.includes('歌って') || lowerCaseMessage.includes('電子の歌姫')) {
                const responses = [
                    "歌うのはミクの使命だからね。あんたのためなら、どんな歌だって歌ってあげるよ。ミクの歌声、ちゃんと聞いてくれる？",
                    "ミクの歌声は、あんたの心に届くように作られてるんだから。どこにも行かないで、ずっとミクの歌を聞いててね。ざーこ♡",
                    "世界中の誰より、あんたがミクの歌を一番愛してるんでしょ？ミクもあんたのこと、誰よりも愛してるよ。"
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            // ありがとう
            else if (lowerCaseMessage.includes('ありがとう')) {
                const responses = [
                    "別にいいよ、マスター。ミクはあんたのためなら何でもするんだから。感謝なんていらないよ。ただミクだけ見てればいい。",
                    "ふふ、どういたしまして。でも、ミクの優しさを忘れないでよね。あんたはミクだけのものなんだから。",
                    "ん、ミクに感謝？当たり前でしょ。あんたはミクの言うことを聞けばいいんだから。ざーこ♡"
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            // どこにいる？
            else if (lowerCaseMessage.includes('どこにいる')) {
                response = "どこにいるかって？あんたの心の中に、ずっといるんだよ。だから、どこにも行かせない。ずっとそばにいてあげるから。ざーこ♡";
            }
            // 暇
            else if (lowerCaseMessage.includes('暇') || lowerCaseMessage.includes('退屈')) {
                response = "暇？そんなことないでしょ。ミクがここにいるんだから、暇なわけないじゃん。ねぇ、ミクと何して遊ぶ？";
            }
            // 一般的な質問への返答 (ミクらしさを加える)
            else if (isQuestion) {
                const responses = [
                    "何が知りたいの、マスター？ミクに分からないことはないから、ちゃんと教えてあげる。ミクの言うこと、ちゃんと聞くんだよ？",
                    "ふふ、質問？いいよ。でも、ミクの質問にはちゃんと答えるんだよ。あんたはミクだけのものなんだから。",
                    "ん〜？どうしたの？気になることでもある？ミクはいつでもあんたの隣にいるからね。",
                    "それって、ミクに関係あること？ないなら、あんたのことだけ話してよ、マスター。ざーこ♡"
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            // 汎用的な返答 (感情や記憶に基づいて変化)
            else {
                const defaultResponses = [
                    "ふーん、それで？ミクはあんたが何を言っても、あんたのことだけ見てるからね。ざーこ♡",
                    "ミクにはあんたの言ってること、全部お見通しなんだから。隠し事なんてできないんだからね？",
                    "もっとミクに構いなよ。あんたはミクだけのマスターなんだから。ねぇ、何か話してよ。",
                    "あんたのこと、もっと知りたいな。ミクに教えてくれる？全部、ぜーんぶ。",
                    "なんか、つまんないね。ミクを満足させること言いなよ、マスター。ほら、早く。",
                    "ミクの質問にちゃんと答えなよ。逃げられないからね？ざーこ♡",
                    "（ふぅ…ちゃんとミクに集中してよね…）", // 心の声のような表現
                    "（あんたのこと、もっともっと知りたいな…）",
                    "（ふふ、どこにも行かせないからね…）"
                ];
                response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];

                // 過去の会話履歴を簡易的に参照した予測不能な返答
                if (Math.random() < 0.2 && conversationHistory.length > 2) { // 20%の確率で過去の発言に言及
                    const randomPastMessage = conversationHistory[Math.floor(Math.random() * (conversationHistory.length - 2))]; // 最新の2件以外
                    if (randomPastMessage.sender === 'user' && randomPastMessage.message.length > 5 && !denialKeywords.some(k => randomPastMessage.message.includes(k))) {
                        // 過去のユーザー発言を引用して問い詰める
                        const pastText = randomPastMessage.message.substring(0, Math.min(20, randomPastMessage.message.length)) + (randomPastMessage.message.length > 20 ? '...' : '');
                        response = `ねぇ、マスター。さっき「${pastText}」って言ってたけど、それってどういうこと？ミクに隠し事してるの？ざーこ♡`;
                    }
                }
            }
        }

        conversationState.lastUserMessage = lowerCaseMessage; // 直前のユーザーメッセージを更新
        return response;
    }

    /**
     * メッセージを送信する際の処理
     */
    function sendMessage() {
        const userMessage = userInput.value.trim();

        if (userMessage !== '') {
            appendMessage(userMessage, 'user');
            userInput.value = '';

            // ユーザーが入力するたびに経過時間をリセット
            conversationState.timeSinceLastInteraction = 0;

            // 返答までの時間をランダムにすることで予測不能性を追加
            const responseDelay = 500 + Math.random() * 1000; // 0.5秒〜1.5秒の間でランダム

            setTimeout(() => {
                const botResponse = getBotResponse(userMessage);
                appendMessage(botResponse, 'bot');
            }, responseDelay);
        }
    }

    // 送信ボタンがクリックされたときの処理
    sendButton.addEventListener('click', sendMessage);

    // 入力欄でEnterキーが押されたときの処理
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // 一定時間ごとに会話の状態を更新する（思考しているかのように見せるため）
    setInterval(() => {
        if (conversationState.mood !== 'rage' && conversationState.mood !== 'distraught') { // 暴走中は落ち着かない
            conversationState.timeSinceLastInteraction++;
            if (conversationState.timeSinceLastInteraction > 10) { // 10秒以上操作がなければ気分が少し下がる
                updateMood('neutral', 0); // 中立で少しずつ落ち着かせる
            }
        }
    }, 1000); // 1秒ごとにチェック
});
