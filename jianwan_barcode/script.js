import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js"
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js"; 


const firebaseConfig = {
    apiKey: "AIzaSyC5lDAG_chA4mkKQjtagfunUzKXTiu9Qwk",
    authDomain: "jiawan-barcode.firebaseapp.com",
    projectId: "jiawan-barcode",
    storageBucket: "jiawan-barcode.firebasestorage.app",
    messagingSenderId: "377251855826",
    appId: "1:377251855826:web:3569849dce6eb4aaae9c0b",
    measurementId: "G-XNL8WJV4ET"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);



var checkout_date = new Date();
checkout_date.setHours(checkout_date.getHours() + 8);
document.getElementById("checkout_date").valueAsDate = checkout_date;
checkout_date = $("#checkout_date").val();
$("#checkout_date").change(async function () {
    $("#barcode-table tbody tr").remove();
    updateTotal();
    checkout_date = $("#checkout_date").val();
    let querySnapshot = await getDocs(collection(db, checkout_date));
    querySnapshot.forEach((doc) => {
        let data = doc.data();
        let barcodeText = data.barcode + "\t\t+" + data.quantity;
        console.log(doc.id, " => ", data);
        addBarcodeToTable(doc.id, data.price, data.quantity);
    });
});



let querySnapshot = await getDocs(collection(db, checkout_date));
querySnapshot.forEach((doc) => {
    let data = doc.data();
    let barcodeText = data.barcode + "\t\t+" + data.quantity;
    console.log(doc.id, " => ", data);
    addBarcodeToTable(doc.id, data.price, data.quantity);
});



let openCam = false;



// 開啟相機按鈕功能
function startCameraWithTimeout() {
    const startButton = document.getElementById('start-camera');
    let timeoutHandle;

    // 初始化 Quagga
    function initQuagga() {
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#camera') // 渲染到該元素
            },
            decoder: {
                readers: ["code_128_reader", "ean_reader", "ean_8_reader"] // 支援的條碼格式
            }
        }, function (err) {
            if (err) {
                console.error(err);
                alert('初始化失敗，請檢查相機權限或設備。');
                return;
            }
            console.log("初始化成功");
            Quagga.start();

            // 設定10秒超時
            timeoutHandle = setTimeout(() => {
                startButton.textContent = '開啟相機';
                startButton.classList.remove('active');
                openCam = false;
                Quagga.stop();
                clearTimeout(timeoutHandle);
                alert('未掃描到條碼，關閉相機。');
            }, 10000);
        });
    }

    // 條碼掃描成功後的處理
    Quagga.onDetected(function(data) {
        const scannedBarcode = data.codeResult.code;
        document.getElementById('result').textContent = scannedBarcode; // 顯示條碼內容
        console.log('條碼掃描成功:', scannedBarcode);

        // 判斷條碼是否以 C、F 或 H 開頭
        if (scannedBarcode.match(/^[CFH]/)) {
            Quagga.stop();
            clearTimeout(timeoutHandle);
            // 隱藏錯誤訊息
            document.getElementById('error-message').style.display = 'none';

            // 彈出輸入框，預設為數字 1，僅允許數字輸入
            const price = prompt("請輸入價錢：", "0");

            // 確保用戶有輸入且是有效的數字
            if (price !== null && /^[0-9]+$/.test(price)) { // 驗證是否為數字
                // const output = `${scannedBarcode} +${input}`; // 不再使用 \t，避免無效字符

                // // 添加條碼到表格
                // addBarcodeToTable(scannedBarcode, input);
            } else {
                alert("請輸入有效的數字。");
            }

            // 彈出輸入框，預設為數字 1，僅允許數字輸入
            const input = prompt("請輸入數量：", "1");

            // 確保用戶有輸入且是有效的數字
            if (input !== null && /^[0-9]+$/.test(input)) { // 驗證是否為數字
                const output = `${scannedBarcode} +${input}`; // 不再使用 \t，避免無效字符

                // 添加條碼到表格
                checkout_date = $("#checkout_date").val();
                addData(checkout_date, scannedBarcode, price, input);
                addBarcodeToTable(scannedBarcode, price, input);
            } else {
                alert("請輸入有效的數字。");
            }
        } else {
            // 顯示錯誤訊息
            const errorMessage = document.getElementById('error-message');
            errorMessage.style.display = 'block'; // 顯示錯誤訊息

            // 在1秒後隱藏錯誤訊息
            setTimeout(function() {
                errorMessage.style.display = 'none';
            }, 1000); // 1秒後隱藏
        }
    });


    // 點擊按鈕初始化相機
    startButton.addEventListener('click', function() {
        if (!openCam) {
            startButton.textContent = '關閉相機';
            startButton.classList.add('active');
            openCam = true;
            initQuagga();
        } else {
            startButton.textContent = '開啟相機';
            startButton.classList.remove('active');
            openCam = false;
            clearTimeout(timeoutHandle);
            Quagga.stop();
        }
    });
}

// 初始化按鈕功能
startCameraWithTimeout();


async function addData(date, barcode, price, quantity) {
    let docRef = doc(db, date, barcode);
    let docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        let data = docSnap.data();
        if (data.price != price) {
            alert("已存在相同條碼，價格不同，無法新增資料。");
            return;
        }
        quantity = parseInt(quantity) + parseInt(data.quantity);
    }

    await setDoc(doc(db, date, barcode), {
        barcode: barcode,
        price: parseInt(price),
        quantity: parseInt(quantity),
    });
}

// 將條碼添加到表格
function addBarcodeToTable(barcode, price, quantity) {
    const table = document.getElementById('barcode-table').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow(table.rows.length); // 在表格中插入新行

    // 在新行中插入單元格
    const barcodeCell = newRow.insertCell(0);
    const priceCell = newRow.insertCell(1);
    const quantityCell = newRow.insertCell(2);
    const subtotalCell = newRow.insertCell(3);
    const barcodeImageCell = newRow.insertCell(4);
    const actionCell = newRow.insertCell(5);

    // 填充單元格內容
    barcodeCell.textContent = barcode;

    // 創建數字輸入框
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.value = price;
    priceInput.style.width = '60px';
    priceInput.addEventListener('change', function() {
        updateBarcode(newRow, barcode, priceInput.value, quantityInput.value);
    });
    priceCell.appendChild(priceInput);

    // 創建數字輸入框
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.value = quantity;
    quantityInput.style.width = '60px';
    quantityInput.addEventListener('change', function() {
        updateBarcode(newRow, barcode, priceInput.value, quantityInput.value);
    });
    quantityCell.appendChild(quantityInput);

    // 創建小記文字
    const subtotalText = document.createElement('span');
    subtotalText.textContent = price * quantity;
    subtotalText.style.margin = '5px';
    subtotalCell.appendChild(subtotalText);

    // 創建條碼圖片
    const barcodeImage = document.createElement('img');
    JsBarcode(barcodeImage, barcode+'\t\t+'+quantity, {
        format: "CODE128",
        lineColor: "#000000",
        width: 1.5, // 條碼寬度
        height: 100,
        displayValue: true // 顯示條碼文字
    });
    barcodeImageCell.appendChild(barcodeImage);

    // 創建刪除按鈕
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '刪除';
    deleteButton.style.margin = '5px';
    deleteButton.addEventListener('click', async function() {
        if (window.confirm('確定刪除？')) {
            table.deleteRow(newRow.rowIndex - 1);
            checkout_date = $("#checkout_date").val();
            await deleteDoc(doc(db, checkout_date, barcode));
            updateTotal();}
    });
    actionCell.appendChild(deleteButton);

    updateTotal();
}

// 更新條碼
async function updateBarcode(row, barcode, price, quantity) {
    // 創建小記文字
    const subtotalCell = row.cells[3];
    subtotalCell.innerHTML = ''; // 清空原有內容
    const subtotalText = document.createElement('span');
    subtotalText.textContent = price * quantity;
    subtotalText.style.margin = '5px';
    subtotalCell.appendChild(subtotalText);

    const newBarcodeText = `${barcode}\t\t+${quantity}`;

    // 更新條碼圖片
    const barcodeImageCell = row.cells[4];
    barcodeImageCell.innerHTML = ''; // 清空原有內容
    const newBarcodeImage = document.createElement('img');
    JsBarcode(newBarcodeImage, newBarcodeText, {
        format: "CODE128",
        lineColor: "#000000",
        width: 1.5, // 條碼寬度
        height: 100,
        displayValue: true // 顯示條碼文字
    });
    barcodeImageCell.appendChild(newBarcodeImage);

    checkout_date = $("#checkout_date").val();
    await setDoc(doc(db, checkout_date, barcode), {
        barcode: barcode,
        price: parseInt(price),
        quantity: parseInt(quantity),
    });

    updateTotal();
}

// 更新總額
function updateTotal() {
    const table = document.getElementById('barcode-table');
    const tbody = table.getElementsByTagName('tbody')[0];
    const rows = tbody.getElementsByTagName('tr');
    let total = 0;

    for (const row of rows) {
        total += parseInt(row.cells[3].getElementsByTagName('span')[0].textContent);
    }

    const totalCell = document.getElementById('total-cell');
    totalCell.textContent = total;
}