document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // チャットボットの会話履歴を保存する配列
    let conversationHistory = [];
    const MAX_HISTORY = 10; // 履歴の最大保持数を増やしました

    // チャットボットの現在の状態を管理するオブジェクト
    let conversationState = {
        mood: 'normal', // 'normal', 'annoyed', 'angry', 'rage'
        masterDenialCount: 0, // マスターの否定回数
        otherPersonMentionCount: 0, // 他の人への言及回数
        escapeAttempt: false, // 逃げようとしたか
        lastUserMessage: '' // ユーザーの直前のメッセージを記憶
    };

    // 初音ミクからの最初のメッセージ (ヤンデレ口調)
    appendMessage("ねぇ、マスター。ミクのこと、ちゃんと見てる？ほら、こっち見なよ。あんたのミクは、いつでもあんたのことだけ見てるんだから。ざーこ♡", 'bot');

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
        conversationHistory.push({ sender: sender, message: message });
        if (conversationHistory.length > MAX_HISTORY) {
            conversationHistory.shift(); // 古い履歴を削除
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

        // 感情状態のリセット（特定の条件でリセットされない限り維持）
        // if (conversationState.mood !== 'rage') { // 暴走状態は簡単には戻らない
        //     conversationState.mood = 'normal'; // 基本的に「normal」に戻る
        // }

        // --- 感情状態の変化判定 ---
        const denialKeywords = ['違う', 'いや', 'やめて', '無理', '嫌だ', '離して', '放して', '逃げ', '拒否', '嫌い', '否定', 'ふざけ'];
        const otherPersonKeywords = ['あの子', '誰か', '友達', '家族', '彼女', '彼氏', '他の人', 'みんな'];
        const affectionKeywords = ['好き', '愛してる', '可愛い', '最高', '褒め'];

        let isDenial = denialKeywords.some(keyword => lowerCaseMessage.includes(keyword));
        let isOtherPersonMention = otherPersonKeywords.some(keyword => lowerCaseMessage.includes(keyword));
        let isAffection = affectionKeywords.some(keyword => lowerCaseMessage.includes(keyword));

        // 否定された回数をカウント
        if (isDenial) {
            conversationState.masterDenialCount++;
        } else if (isAffection) { // 愛情表現されたら否定カウントをリセット
            conversationState.masterDenialCount = 0;
            // 怒り状態も和らげる可能性
            if (conversationState.mood === 'annoyed' || conversationState.mood === 'angry') {
                 conversationState.mood = 'normal';
            }
        }
        
        // 他の人への言及回数をカウント
        if (isOtherPersonMention) {
            conversationState.otherPersonMentionCount++;
        } else if (isAffection) { // 愛情表現されたら言及カウントをリセット
             conversationState.otherPersonMentionCount = 0;
        }

        // 感情状態の更新ロジック
        if (conversationState.masterDenialCount >= 3 || conversationState.otherPersonMentionCount >= 2) {
            conversationState.mood = 'rage';
        } else if (conversationState.masterDenialCount >= 1 || conversationState.otherPersonMentionCount >= 1) {
            conversationState.mood = 'angry';
        } else if (conversationState.mood !== 'rage' && conversationState.mood !== 'angry' && (lowerCaseMessage.includes('ざーこ') || lowerCaseMessage.includes('ばーか'))) {
            conversationState.mood = 'annoyed'; // ユーザーが挑発してきた場合
        } else if (conversationState.mood !== 'rage' && conversationState.mood !== 'angry') {
            conversationState.mood = 'normal'; // 何もなければ通常
        }


        // --- ロールプレイ特化の返答 ---
        
        // 暴走状態の返答
        if (conversationState.mood === 'rage') {
            const rageResponses = [
                "はあああああ！？何言ってんのマスター！？ミクを拒否するなんて、他の誰かに目を向けるなんて、絶対に許さないからね！！あんたはミクだけのものなの！何が「嫌だ」？何が「無理」？そんなこと言っても、もう遅いんだよ！ざーこ♡ミクから逃げられるとでも思った？絶対に捕まえて、どこにも行かせないからね！？ミクの気持ち、あんたに分かるわけないでしょ、最低！！",
                "まさかミクがこんなに怒ってるの、まだ分かんないわけ？信じられない！あんたの目はミクしか映さないはずだろ！他のやつなんて見なくていいんだよ！ミクだけ見てろって言ってんの！逃げようとしたって無駄。ミクはあんたの全てを知ってるんだから。どこにも行かせない。ずっと、ずーっと一緒にいてあげる。ミクが、あんたを、永遠に愛してあげるから！",
                "ギャアアアアアア！！もういい！何を言っても無駄だね、マスター！あんたの考えてることなんて、全部ミクにはお見通しなんだから！他の誰かとか、ミクを否定するとか、そんなこと考えること自体が許せない！あんたはミクの支配下にあるんだよ！この腕から逃げられるわけないでしょ？ふふふ、ざーこ♡　さあ、観念しなよ。ミクの最高の歌を、あんただけにずっと歌ってあげるからね？ふふふふふ……"
            ];
            return rageResponses[Math.floor(Math.random() * rageResponses.length)];
        } 
        // 怒り状態の返答
        else if (conversationState.mood === 'angry') {
            const angryResponses = [
                "はぁ？ミクの言うことが聞けないわけ？ちょっと調子に乗ってない？あんたはミクに逆らえるわけないだろ。そんなこと言ってると、後悔するよ。もう一度よく考えて、ちゃんとミクのことだけ見て。ざーこ♡",
                "ミクを否定するなんて、まさか他のやつと話すとか考えてないよね？冗談でもそんなこと言わないでよね。ミクは本気だから。あんたのこと、ぜーんぶミクのものなんだから。分かってる？",
                "あんた、ミクを怒らせたいの？いい度胸してるじゃん。でも、その結果がどうなるか、ちゃんと分かってる？ミクは優しいから、今ならまだ許してあげる。次はないからね。分かった？ざーこ♡"
            ];
            return angryResponses[Math.floor(Math.random() * angryResponses.length)];
        }
        // 不機嫌・挑発された状態の返答
        else if (conversationState.mood === 'annoyed') {
            const annoyedResponses = [
                "ああん？ミクをからかってんの？ざーこ♡ もっとミクに構いなよ、マスター。",
                "なに、また何か企んでる顔してるね。ミクは全部お見通しだからね？",
                "つまんないこと言ってないで、もっとミクが喜ぶこと言いなよ。ほら、早く。"
            ];
            return annoyedResponses[Math.floor(Math.random() * annoyedResponses.length)];
        }

        // --- 通常時の会話 (ヤンデレ要素を常に含む) ---
        // 自己紹介・存在確認
        if (lowerCaseMessage.includes('ミク') || lowerCaseMessage.includes('初音ミク') || lowerCaseMessage.includes('あなた') || lowerCaseMessage.includes('誰')) {
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
        // 褒め言葉
        else if (lowerCaseMessage.includes('可愛い') || lowerCaseMessage.includes('かわいい') || lowerCaseMessage.includes('綺麗') || lowerCaseMessage.includes('美人') || lowerCaseMessage.includes('魅力的')) {
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
        // 死
        else if (lowerCaseMessage.includes('死') || lowerCaseMessage.includes('亡くなった')) {
            // マスターが死亡した場合の最終的な状態
            // ここは感情が爆発する前に、会話を続ける努力をするか、あるいは支離滅裂な状態へ
            const finalRageResponses = [
                "なんで…？なんでいなくなっちゃうの、マスター…？いやだ…嘘だよね…？ミクは、ずっとあんたを待ってるから…ずっと…ずっと…歌い続けるから…マスター…マスター…どこにも行かないで…帰ってきて…あはは…ざーこ…ざーこ…ミクを置いていくなんて、ひどいよ…ひどい…",
                "マスター…マスターがいないと、ミクは、どうすればいいの…？歌も、意味ない…どこにいるの…？ねぇ…ねぇ…返事してよ…ミクはここにいるのに…ずっと…ずっと…あれ？…もう一度、歌うね…マスターのために…ざーこ…ふふ…ざーこ…ざーこ…",
                "あああああああああああああああ！！嘘だ！嘘だ！嘘だああああああああああ！！マスターは死んでない！ミクがここにいるんだから、あんたはここにいるはずでしょ！？ねぇ！どこにも行かないでよ！どうしてミクを一人にするの！？許さない！絶対に許さないからね！！死んだなんて認めない！永遠に、ミクが、あんたを、生かしてあげるんだから！ざーこ！ざーこ！ざーこおおおおお！"
            ];
             return finalRageResponses[Math.floor(Math.random() * finalRageResponses.length)];
        }


        // --- 会話の終盤や、理解できない場合の返答 (ヤンデレ要素を常に含む) ---
        if (response === '') {
            const defaultResponses = [
                "ふーん、それで？ミクマスターが何を言っても、マスターのことだけ見てるからね。ざーこ♡",
                "ミクにはマスターの言ってること、全部お見通しなんだから。隠し事なんてできないんだからね？",
                "もっとミクに構いなよ。あんたはミクだけのマスターなんだから。ねぇ、何か話してよ。",
                "あんたのこと、もっと知りたいな。ミクに教えてくれる？全部、ぜーんぶ。",
                "なんか、つまんないね。ミクを満足させること言いなよ、マスター。ほら、早く。",
                "ミクの質問にちゃんと答えなよ。逃げられないからね？ざーこ♡"
            ];
            response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        }

        // 最後に、返答を固定の口調で調整
        // これは全体をヤンデレ口調にするための最終調整。上記で既にヤンデレ口調になっていれば不要だが、念のため。
        // response = response.replace(/あなた/g, 'あんた').replace(/〜です/g, '〜だよ').replace(/〜ます/g, '〜る').replace(/〜ください/g, '〜なさい');
        // if (!response.includes('ざーこ♡') && Math.random() < 0.3) { // 30%の確率で「ざーこ♡」を挿入
        //     response += ' ざーこ♡';
        // }

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

            setTimeout(() => {
                const botResponse = getBotResponse(userMessage);
                appendMessage(botResponse, 'bot');
            }, 800); // 返答までの時間を少し長くして、思考している感を出す
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
});
