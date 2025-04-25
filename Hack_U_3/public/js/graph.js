import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc ,getDoc} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
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





// ここから、グラフ表示

let allcoordinate = []; // 全書籍データを保持する変数

// 全データ取得関数
async function getAllCoordinate() {
  try {
    const bookScoreRef = collection(db, "reviews");
    const querySnapshot = await getDocs(bookScoreRef);
    
    allcoordinate = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('全データ取得完了:', allcoordinate);
    
  } catch (error) {
    console.error("データ取得エラー:", error);
    createErrorMessage('データの取得に失敗しました');
  }
}

// 初期処理
document.addEventListener('DOMContentLoaded', async () => {


    });


// エラーメッセージ表示関数
function createErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.textContent = message;
    errorDiv.style.color = '#ff4444';
    errorDiv.style.padding = '15px';
    errorDiv.style.border = '1px solid #ffcccc';
    errorDiv.style.margin = '20px';

    const bookListContainer = document.getElementById("book-list");
    
    if (bookListContainer) {
        bookListContainer.appendChild(errorDiv);
    } else {
        document.body.appendChild(errorDiv);
    }
}
