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
let app = initializeApp(firebaseConfig);
let analytics = getAnalytics(app);

// Initialize Cloud Firestore and get a reference to the service
let db = getFirestore(app);



const barcodeView = {
    format: "CODE128",
    lineColor: "#000000",
    width: 1.5,
    height: 100,
    displayValue: true
}

let isCamActivated = false;



init();

function init() {
    initDate(8);
    initCamBtn();

    loadData($("#checkout_date").val());
}



// 初始化 日期
function initDate(timeZone=0) {
    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let currentDate = `${year}-${month}-${day}`;
    console.log(currentDate);

    $("#checkout_date").val(currentDate);
    
    $("#checkout_date").change(async function () {
        $("#barcode_table tbody tr").remove();
        await loadData($("#checkout_date").val());
        updateTotal();
    });
}

// 載入資料
async function loadData(date) {
    let querySnapshot = await getDocs(collection(db, date));

    querySnapshot.forEach((doc) => {
        let data = doc.data();

        console.log(doc.id, " => ", data);
        addBarcodeToTable(doc.id, data.price, data.quantity);
    });
}

// 初始化 相機按鈕
function initCamBtn() {
    $("#start_camera").click(function() {
        if (!isCamActivated) {
            startCam();
        } else {
            stopCam();
        }
    });
}

// 初始化 Quagga
function initQuagga() {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector("#camera") // 渲染到該元素
        },
        decoder: {
            readers: ["ean_reader"] // 支援的條碼格式
        }
    }, function (err) {
        if (err) {
            console.error(err);
            alert("初始化失敗，請檢查相機權限或設備。");
            return;
        }
        console.log("初始化成功");
        Quagga.start();
    });

    // 條碼掃描成功後的處理
    Quagga.onDetected(function(data) {
        let scannedBarcode = data.codeResult.code;
        $("#scanned_barcode").text(scannedBarcode); // 顯示條碼內容
        console.log("條碼掃描成功:", scannedBarcode);

        if (isMatch(scannedBarcode)) {
            // if (!$("#keep_activated").prop("checked")) {
            //     stopCam();
            // }
            stopCam();

            // 彈出輸入框，僅允許數字輸入
            let price = prompt("請輸入價錢：", "");
            // 確保用戶有輸入且是有效的數字
            if (price == null || !/^[0-9]+$/.test(price)) { // 空 或 非數字
                alert("請輸入有效的數字。");
                return;
            }

            // 彈出輸入框，僅允許數字輸入
            let quantity = prompt("請輸入數量：", "");
            // 確保用戶有輸入且是有效的數字
            if (quantity == null || !/^[0-9]+$/.test(quantity)) {  // 空 或 非數字
                alert("請輸入有效的數字。");
                return;
            }

            // 添加條碼到資料庫
            addData(scannedBarcode, price, quantity);
            // 添加條碼到表格
            addBarcodeToTable(scannedBarcode, price, quantity);
        } else {
            // 顯示錯誤訊息
            $("#error_message").show(); // 顯示錯誤訊息
            // 在1秒後隱藏錯誤訊息
            setTimeout(function() {
                $("#error_message").hide();
            }, 1000); // 1秒後隱藏
        }
    });
}

// 開啟相機
function startCam() {
    $("#start_camera").text("關閉相機");
    $("#start_camera").addClass("active");
    isCamActivated = true;
    initQuagga();
}

// 關閉相機
function stopCam() {
    $("#start_camera").text("開啟相機");
    $("#start_camera").removeClass("active");
    isCamActivated = false;
    Quagga.stop();
    // 隱藏錯誤訊息
    $("#error_message").hide();
}

// 添加條碼到資料庫
async function addData(barcode, price, quantity) {
    let date = $("#checkout_date").val();
    let docRef = doc(db, date, barcode);
    let docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        let data = docSnap.data();
        if (data.price != price) {
            alert("已存在相同條碼，價格不同，無法新增資料。");
            return;
        }
        // 價格相同，增加數量
        quantity = parseInt(quantity) + parseInt(data.quantity);
    }

    await setDoc(docRef, {
        barcode: barcode,
        price: parseInt(price),
        quantity: parseInt(quantity),
    });
}

// 將條碼添加到表格
function addBarcodeToTable(barcode, price, quantity) {
    // 獲取表格的主體部分
    let tableBody = $("#barcode_table tbody");
    let newRow = $("<tr></tr>");
    let barcodeCell = $("<td></td>").text(barcode);
    newRow.append(barcodeCell);
    
    // 價格單元格
    let priceInput = $('<input>', {
        type: "tel",
        value: price,
        style: "width: 60px;",
        change: function () {
            updateBarcode(newRow, barcode, priceInput.val(), quantityInput.val());
        }
    });
    let priceCell = $("<td></td>").append(priceInput);
    newRow.append(priceCell);
    
    // 數量單元格
    let quantityInput = $('<input>', {
        type: "tel",
        value: quantity,
        style: "width: 60px;",
        change: function () {
            updateBarcode(newRow, barcode, priceInput.val(), quantityInput.val());
        }
    });
    let quantityCell = $("<td></td>").append(quantityInput);
    newRow.append(quantityCell);
    
    // 小計單元格
    let subtotal = price * quantity;
    let subtotalText = $("<span></span>").text(subtotal);
    let subtotalCell = $("<td></td>").append(subtotalText);
    newRow.append(subtotalCell);
    
    // 條碼圖片單元格
    let barcodeImageCell = $("<td></td>");
    let barcodeImage = document.createElement("img");
    JsBarcode(barcodeImage, `${barcode}\t\t+${quantity}`, barcodeView);
    barcodeImageCell.append(barcodeImage);
    newRow.append(barcodeImageCell);
    
    // 操作單元格（刪除按鈕）
    let deleteButton = $("<button></button>", {
        text: "刪除",
        style: "margin: 5px;",
        click: async function () {
            if (window.confirm("確定刪除？ 無法復原！")) {
                newRow.remove();
                let checkoutDate = $("#checkout_date").val();
                await deleteDoc(doc(db, checkoutDate, barcode));
                updateTotal();
            }
        }
    });
    let actionCell = $("<td></td>").append(deleteButton);
    newRow.append(actionCell);
    
    // 將新行添加到表格
    tableBody.append(newRow);
    
    // 更新總計
    updateTotal();
}


// 更新條碼
async function updateBarcode(row, barcode, price, quantity) {
    // 更新小計單元格內容
    let subtotalCell = $(row).find("td").eq(3); // 使用jQuery選擇第4個單元格
    subtotalCell.empty(); // 清空原有內容
    let subtotalText = $("<span></span>").text(price * quantity); // 計算新的小計
    subtotalText.css("margin", "5px");
    subtotalCell.append(subtotalText);

    // 生成新的條碼文字
    let newBarcodeText = `${barcode}\t\t+${quantity}`;

    // 更新條碼圖片
    let barcodeImageCell = $(row).find("td").eq(4); // 使用jQuery選擇第5個單元格
    barcodeImageCell.empty(); // 清空原有內容
    let newBarcodeImage = $("<img>");
    JsBarcode(newBarcodeImage[0], newBarcodeText, barcodeView);
    barcodeImageCell.append(newBarcodeImage);

    // 更新數據庫中的條碼數據
    let checkoutDate = $("#checkout_date").val(); // 獲取結帳日期
    await setDoc(doc(db, checkoutDate, barcode), {
        barcode: barcode,
        price: parseInt(price), // 確保價格為整數
        quantity: parseInt(quantity), // 確保數量為整數
    });

    // 更新總計
    updateTotal();
}


// 更新總額
function updateTotal() {
    let table = document.getElementById("barcode_table");
    let tbody = table.getElementsByTagName("tbody")[0];
    let rows = tbody.getElementsByTagName("tr");
    let total = 0;

    for (let row of rows) {
        total += parseInt(row.cells[3].getElementsByTagName("span")[0].textContent);
    }

    let totalCell = document.getElementById("total-cell");
    totalCell.textContent = total;
}

// 是否符合條件
function isMatch(code) {
    // 200000 開頭
    return code.match(/^200000/);
}