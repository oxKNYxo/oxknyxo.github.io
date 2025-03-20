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



let now = new Date();
now.setHours(now.getHours() + 8); // 調整為 UTC+8
let today = now.toISOString().split("T")[0]; // 轉換成 YYYY-MM-DD
console.log(today);

init();

function init() {
    resetInput();
    dateSetting(8);
    loadData(today);
}



$(document).ready(function(){
    $(".prefixBtn").on("click", function(){
        let prefix = $(this).data("prefix"); // 取得 data-prefix 屬性的值
        setPrefix(prefix);
    });

    $(".priceBtn").on("click", function(){
        let price = $(this).data("price"); // 取得 data-price 屬性的值
        setPrice(price);
    });

    $(".quantityBtn").on("click", function(){
        let quantity = $(this).data("quantity"); // 取得 data-price 屬性的值
        setQuantity(quantity);
    });

    $("#submitBtn").on("click", function() {
        let code = $("#codeInput").val();
        let price = $("#priceInput").val();
        let quantity = $("#quantityInput").val();
        let date = $("#checkoutDate").val();

        console.log("code", code);
        console.log("price", price);
        console.log("quantity", quantity);
        console.log("date", date);

        submit(code, price, quantity);
    })
});


function setPrefix(prefix) {
    $("#codeInput").val(prefix);
}
function setPrice(price) {
    $("#priceInput").val(price);
}
function setQuantity(quantity) {
    $("#quantityInput").val(quantity);
}


// 日期設定
function dateSetting(timeZone=8) {
    $("#checkoutDate").val(today);
    
    $("#checkoutDate").change(async function () {
        $("#barcodeTable tbody tr").remove();
        await loadData($("#checkoutDate").val());
        updateTotal();
    });
}

async function loadData(date) {
    let querySnapshot = await getDocs(collection(db, date));

    querySnapshot.forEach((doc) => {
        let data = doc.data();

        console.log(doc.id, " => ", data);
        addBarcodeToTable(doc.id, data.price, data.quantity);
    });
}



function submit(code, price, quantity) {
    if (!code) {
        alert("請輸入編號", "danger");
        return;
    }
    if (!price || isNaN(price)) {
        alert("請輸入價格", "danger");
        return;
    }
    if (!quantity || isNaN(quantity)) {
        alert("請輸入數量", "danger");
        return;
    }
    addData(code, price, quantity);
    addBarcodeToTable(code, price, quantity);
    alert(code+" 加入成功", "success");
    resetInput();
}

function resetInput() {
    $("#codeInput").val("")
    $("#priceInput").val("")
    $("#quantityInput").val("")
}

function alert(message, type) {
    var wrapper = document.createElement("div");
    wrapper.innerHTML = `
        <div class="alert alert-${type} alert-dismissible">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    $("#alertPlaceholder").prepend(wrapper);
    setTimeout(()=>{
        document.getElementById('alertPlaceholder').lastChild.remove();
    }, 3000);
}


// 添加條碼到資料庫
async function addData(barcode, price, quantity) {
    let date = $("#checkoutDate").val();
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
    let tableBody = $("#barcodeTable tbody");
    let newRow = $("<tr></tr>");
    let barcodeCell = $("<td></td>").text(barcode);
    newRow.append(barcodeCell);
    
    // 價格單元格
    let priceInput = $("<input>", {
        type: "number",
        value: price,
        style: "width: 60px;",
        change: function () {
            updateBarcode(newRow, barcode, priceInput.val(), quantityInput.val());
        }
    });
    let priceCell = $("<td></td>").append(priceInput);
    newRow.append(priceCell);
    
    // 數量單元格
    let quantityInput = $("<input>", {
        type: "number",
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
    let deleteButton = $(`<button></button>`, {
        text: "刪除",
        class: "btn btn-danger",
        click: async function () {
            if (window.confirm("確定刪除？ 無法復原！")) {
                newRow.remove();
                let checkoutDate = $("#checkoutDate").val();
                await deleteDoc(doc(db, checkoutDate, barcode));
                updateTotal();
            }
        }
    });
    let actionCell = $("<td></td>").append(deleteButton);
    newRow.append(actionCell);
    
    // 將新行添加到表格
    tableBody.prepend(newRow);

    
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
    let checkoutDate = $("#checkoutDate").val(); // 獲取結帳日期
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
    let table = document.getElementById("barcodeTable");
    let tbody = table.getElementsByTagName("tbody")[0];
    let rows = tbody.getElementsByTagName("tr");
    let total = 0;

    for (let row of rows) {
        total += parseInt(row.cells[3].getElementsByTagName("span")[0].textContent);
    }

    let totalCell = document.getElementById("totalCell");
    totalCell.textContent = total;
}