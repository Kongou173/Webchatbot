document.addEventListener('DOMContentLoaded', () => {
    // HTML要素をJavaScriptで操作できるように取得します
    const chatMessages = document.getElementById('chat-messages'); // メッセージが表示される領域
    const userInput = document.getElementById('user-input');       // ユーザーの入力欄
    const sendButton = document.getElementById('send-button');     // 送信ボタン

    /**
     * メッセージをチャット画面に表示する関数
     * @param {string} message - 表示するメッセージの内容
     * @param {string} sender - 'user' または 'bot' で、どちらが送ったメッセージかを示す
     */
    function appendMessage(message, sender) {
        const messageDiv = document.createElement('div'); // 新しいdiv要素を作成
        messageDiv.classList.add('message', `${sender}-message`); // 'message'と送信者に応じたクラスを追加
        messageDiv.textContent = message; // メッセージの内容を設定

        chatMessages.appendChild(messageDiv); // チャットメッセージ表示領域に新しいメッセージを追加
        chatMessages.scrollTop = chatMessages.scrollHeight; // 最新のメッセージが見えるようにスクロール
    }

    /**
     * チャットボットの返答ロジック
     * @param {string} userMessage - ユーザーが入力したメッセージ
     * @returns {string} チャットボットの返答
     */
    function getBotResponse(userMessage) {
        const lowerCaseMessage = userMessage.toLowerCase(); // 入力されたメッセージを小文字に変換して比較しやすくする

        // シンプルなルールベースの返答
        if (lowerCaseMessage.includes('こんにちは') || lowerCaseMessage.includes('こんばんは')) {
            return 'こんにちは！何かお手伝いできることはありますか？';
        } else if (lowerCaseMessage.includes('ありがとう')) {
            return 'どういたしまして！お役に立てて嬉しいです。';
        } else if (lowerCaseMessage.includes('元気？')) {
            return '私は元気ですよ！あなたはいかがですか？';
        } else if (lowerCaseMessage.includes('名前')) {
            return '私はシンプルなチャットボットです。あなたの名前は何ですか？';
        } else if (lowerCaseMessage.includes('天気')) {
            return 'ごめんなさい、私は今の天気情報を知ることができません。';
        } else if (lowerCaseMessage.includes('さようなら') || lowerCaseMessage.includes('またね')) {
            return 'さようなら！またいつでも話しかけてくださいね。';
        } else if (lowerCaseMessage.includes('何ができる')) {
            return '私はあなたの質問に答えたり、簡単な会話をしたりできます。';
        } else if (lowerCaseMessage.includes('日付')) {
            const today = new Date();
            return `今日は${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日です。`;
        } else if (lowerCaseMessage.includes('時間')) {
            const now = new Date();
            return `現在の時刻は${now.getHours()}時${now.getMinutes()}分です。`;
        }
        else {
            return 'すみません、よく分かりません。別の質問をしてください。';
        }
    }

    /**
     * メッセージを送信する際の処理
     */
    function sendMessage() {
        const userMessage = userInput.value.trim(); // 入力欄からメッセージを取得し、前後の空白を除去

        // メッセージが空でなければ処理を実行
        if (userMessage !== '') {
            appendMessage(userMessage, 'user'); // ユーザーのメッセージを画面に表示
            userInput.value = ''; // 入力欄をクリア

            // ボットの返答を少し遅らせて表示することで、より自然な会話に見せる
            setTimeout(() => {
                const botResponse = getBotResponse(userMessage); // ボットの返答を取得
                appendMessage(botResponse, 'bot'); // ボットの返答を画面に表示
            }, 500); // 0.5秒後に実行
        }
    }

    // 送信ボタンがクリックされたときの処理
    sendButton.addEventListener('click', sendMessage);

    // 入力欄でEnterキーが押されたときの処理
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') { // 押されたキーがEnterキーであれば
            sendMessage(); // メッセージ送信処理を実行
        }
    });
});
