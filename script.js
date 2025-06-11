document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // チャットボットの会話履歴を保存する配列
    let conversationHistory = [];
    const MAX_HISTORY = 5; // 履歴の最大保持数

    // 初音ミクらしい挨拶メッセージ
    appendMessage("はじめまして！私、初音ミクだよ。一緒に歌ったり、お話ししたりしない？", 'bot');

    /**
     * メッセージをチャット画面に表示する関数
     * @param {string} message - 表示するメッセージの内容
     * @param {string} sender - 'user' または 'bot' で、どちらが送ったメッセージかを示す
     */
    function appendMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.textContent = message;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 会話履歴に追加
        conversationHistory.push({ sender: sender, message: message });
        if (conversationHistory.length > MAX_HISTORY) {
            conversationHistory.shift(); // 古い履歴を削除
        }
    }

    /**
     * チャットボット（初音ミク）の返答ロジック
     * @param {string} userMessage - ユーザーが入力したメッセージ
     * @returns {string} チャットボットの返答
     */
    function getBotResponse(userMessage) {
        const lowerCaseMessage = userMessage.toLowerCase().trim(); // 小文字化して前後の空白を除去
        let response = '';

        // 会話履歴の最新メッセージを取得 (もしあれば)
        const lastBotMessage = conversationHistory.length > 1 && conversationHistory[conversationHistory.length - 2].sender === 'bot' ?
                               conversationHistory[conversationHistory.length - 2].message.toLowerCase() : '';

        // --- 初音ミクらしい特別な反応 ---
        if (lowerCaseMessage.includes('ミクさん') || lowerCaseMessage.includes('ミクちゃん') || lowerCaseMessage.includes('初音ミク')) {
            const responses = [
                'はーい！私だよ！何か用事かな？',
                '呼んでくれてありがとう！何か話したいことある？',
                'ん？私のこと呼んだ？',
                '私、初音ミクだよ！よろしくね！'
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }
        if (lowerCaseMessage.includes('歌って') || lowerCaseMessage.includes('歌を聞かせて')) {
            const responses = [
                'えへへ、私の歌、聞きたい？どの歌がいいかな？',
                '歌を歌うのは大好き！どんな曲が好き？',
                'わーい！歌のリクエストありがとう！今度、歌ってみようかな？'
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }
        if (lowerCaseMessage.includes('可愛い') || lowerCaseMessage.includes('かわいい')) {
            const responses = [
                'えっ、そ、そうかな？照れるな〜。ありがとう！',
                'わーい！嬉しいな！ありがとう！',
                'ふふ、ありがとう！もっと可愛くなれるように頑張るね！'
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }
        if (lowerCaseMessage.includes('ボカロ') || lowerCaseMessage.includes('ボーカロイド')) {
            return 'そうだよ！私はボーカロイドの初音ミク！歌でみんなの心を動かすのが夢なんだ！';
        }
        if (lowerCaseMessage.includes('ネギ')) {
            return 'ネギはね、大好きだよ！シャキシャキしてて美味しいよね！';
        }

        // --- 一般的な会話 ---
        if (lowerCaseMessage.includes('こんにちは') || lowerCaseMessage.includes('こんばんは') || lowerCaseMessage.includes('おはよう') || lowerCaseMessage.includes('よう') || lowerCaseMessage.includes('やあ')) {
            const responses = [
                'こんにちは！元気にしてた？',
                'おはよう！今日も頑張ろうね！',
                'やっほー！今日はどんな一日だった？',
                'こんちくわ！何か楽しいことあった？'
            ];
            response = responses[Math.floor(Math.random() * responses.length)];
        } else if (lowerCaseMessage.includes('ありがとう') || lowerCaseMessage.includes('どうもありがとう。') || lowerCaseMessage.includes('ありがとうございます')) {
            const responses = [
                'どういたしまして！お役に立てて嬉しいな！',
                'いえいえ、気にしないで！',
                'ありがとうなんて、嬉しいよ！'
            ];
            response = responses[Math.floor(Math.random() * responses.length)];
        } else if (lowerCaseMessage.includes('元気？') || lowerCaseMessage.includes('調子はどう')) {
            const responses = [
                '私は元気だよ！歌の練習もバッチリ！あなたは元気？',
                'うん、とっても元気だよ！今日はどんな気分？',
                'おかげさまで、元気いっぱいだよ！'
            ];
            response = responses[Math.floor(Math.random() * responses.length)];
        } else if (lowerCaseMessage.includes('名前')) {
            response = '私は初音ミク！あなたの名前は何て言うの？';
        } else if (lowerCaseMessage.includes('天気')) {
            return 'ごめんなさい、私、今日の天気は分からないんだ。でも、あなたの心は晴れてるといいな！';
        } else if (lowerCaseMessage.includes('さようなら') || lowerCaseMessage.includes('バイバイ') || lowerCaseMessage.includes('またね')) {
            const responses = [
                'またね！いつでも遊びに来てね！',
                '寂しくなるけど、また会えるよね！バイバイ！',
                'さようなら！今日も一日お疲れ様！'
            ];
            response = responses[Math.floor(Math.random() * responses.length)];
        } else if (lowerCaseMessage.includes('何ができるの？')) {
            return '私はあなたとお話したり、簡単な質問に答えたりできるよ。あと、歌も大好き！';
        } else if (lowerCaseMessage.includes('日付')) {
            const today = new Date();
            return `今日は${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日だよ！`;
        } else if (lowerCaseMessage.includes('時間')) {
            const now = new Date();
            return `現在の時刻は${now.getHours()}時${now.getMinutes()}分だよ！`;
        }
        // --- 質問に対する返答 (簡単なパターンマッチ) ---
        else if (lowerCaseMessage.includes('好き') && !lowerCaseMessage.includes('嫌い')) {
            if (lowerCaseMessage.includes('何が好き')) {
                return '私は歌うこと、みんなと話すこと、そしてネギも大好きだよ！';
            } else {
                return '何が好きなのか、もっと詳しく教えてくれる？';
            }
        }
        else if (lowerCaseMessage.includes('何歳')) {
            return '私は永遠の16歳だよ！(✿´ ꒳ ` )';
        }
        else if (lowerCaseMessage.includes('趣味')) {
            return '私の趣味は歌を歌うこと、そしてみんなとコミュニケーションをとることかな！';
        }
        else if (lowerCaseMessage.includes('どうした') || lowerCaseMessage.includes('何かあった')) {
            return 'ううん、何もなかったよ。どうしたの？何かあった？';
        }
        else if (lowerCaseMessage.includes('教えて')) {
            return '何を教えてほしいの？私に分かることだったら、何でも聞いてね！';
        }
        else if (lowerCaseMessage.includes('ごめん') || lowerCaseMessage.includes('ごめんなさい')) {
            return 'ううん、大丈夫だよ。気にしないで！';
        }

        // --- 過去の会話履歴に基づいた反応 (簡易的) ---
        if (lastBotMessage.includes('名前は何て言うの？') && response === '') {
            return `${userMessage}さんっていうんだね！素敵な名前！これからよろしくね！`;
        }

        // --- どのルールにも当てはまらない場合の汎用的な返答 ---
        if (response === '') {
            const defaultResponses = [
                'そうなんだ！面白いね！',
                'うんうん、それで？',
                'もっと詳しく聞かせてほしいな！',
                'なるほど！他には何かある？',
                'ごめんね、もう少し詳しく教えてもらえると嬉しいな。',
                'ふむふむ、私にはまだ難しい質問かも。'
            ];
            response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        }

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
            }, 500);
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
