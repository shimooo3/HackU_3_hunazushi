import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, connectStorageEmulator, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};

// Firebase を初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ローカルで実行中の場合は、エミュレータを使う
const isEmulating = window.location.hostname === 'localhost'
if (isEmulating) {
    const storage = getStorage()
    connectStorageEmulator(storage, 'localhost', 9199)
}

// ここまでFirestoreのセッティング

// データ処理関数
async function addReviewToFirestore(bookId, title, imageUrl, x, y, emotion) {
    try {
        const docRef = await addDoc(collection(db, "reviews"), {
            bookId: bookId,
            title: title,
            imageUrl: imageUrl,
            x: x,
            y: y,
            emotion: emotion
        });
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

async function addImageToStorage(imageFile) {

    if (imageFile) {
        const uniqueId = crypto.randomUUID();
        const storageRef = ref(storage, `images/${uniqueId}.png`);
        await uploadBytes(storageRef, imageFile).then((snapshot) => {
            console.log('Uploaded a blob or file!');
        }).catch((error) => {
            console.error("Error uploading file: ", error);
        });

        const imageUrl = await getDownloadURL(storageRef);
        return imageUrl;
    }
}

function fileToImage(file, callback) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = () => callback(img);
        img.onerror = () => console.error("Failed to load image");
        img.src = event.target.result;
    };
    reader.onerror = () => console.error("Failed to read file");
    reader.readAsDataURL(file);
}

async function getBookId() {
    // bookIdをfirestoreの最大値+1で初期化
    let bookId = 0;
    const reviewsRef = collection(db, "reviews");
    const reviewsQuery = await getDocs(reviewsRef);
    if (!reviewsQuery.empty) {
        reviewsQuery.forEach((doc) => {
            const data = doc.data();
            if (data.bookId > bookId) {
                bookId = data.bookId;
            }
        });
    }
    bookId++;
    return bookId;
}
// 各種イベントリスナー

// タブボタン押下時の処理
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function () {
        // すべてのタブボタンからactiveクラスを削除
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

        // クリックされたボタンにactiveクラスを追加
        this.classList.add('active');

        // 選択された感情を取得
        let selectedEmotion = this.getAttribute('data-emotion');
        console.log("Selected Emotion: ", selectedEmotion);
    });
});

// 投稿ボタン押下時の処理
document.getElementById("submit").addEventListener("click", async function (event) {
    event.preventDefault();

    // check image2vec function
    if (typeof image2vec !== 'function') {
        console.error('image2vec関数が定義されていません');
        hideLoading();
        return;
    }

    let title = document.getElementById("title").value;
    let imageInput = document.getElementById("image");
    let selectedEmotion = document.querySelector('.tab-button.active').getAttribute('data-emotion');
    let imageFile = imageInput.files[0];

    // 画像やタイトルが選択されていない場合はエラーメッセージを表示
    if (!imageFile || !title) {
        alert("タイトルと画像を選択してください。");
        return;
    }

    // Storageに格納
    const imageUrl = await addImageToStorage(imageFile);

    // 平均と分散を用いてx, yを計算
    fileToImage(imageFile, async function (img) {
        const image_data = image2vec(img, selectedEmotion);

        const bookId = await getBookId(); // bookIdを取得

        // Firestoreに格納
        addReviewToFirestore(bookId, title, imageUrl, image_data.stats.x, image_data.stats.y, selectedEmotion); // bookId, title, imageUrl, x, y, emotion
    });

    // 画面を更新
    document.getElementById("submitted-container").style.display = "block";
    document.getElementById("posting-container").style.display = "none";
});

// 画像選択時の処理
document.getElementById("image").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imgElement = document.getElementById("preview"); // preview 要素を取得
            imgElement.style.display = "block"; // プレビューを表示
            imgElement.src = e.target.result; // src を更新
        };
        reader.readAsDataURL(file);
    }
});
