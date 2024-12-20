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
                Quagga.stop();
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
                // addBarcodeToTable(scannedBarcode, input, output);
            } else {
                alert("請輸入有效的數字。");
            }

            // 彈出輸入框，預設為數字 1，僅允許數字輸入
            const input = prompt("請輸入數量：", "1");

            // 確保用戶有輸入且是有效的數字
            if (input !== null && /^[0-9]+$/.test(input)) { // 驗證是否為數字
                const output = `${scannedBarcode} +${input}`; // 不再使用 \t，避免無效字符

                // 添加條碼到表格
                addBarcodeToTable(scannedBarcode, price, input, output);
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
    startButton.addEventListener('click', initQuagga);
}

// 初始化按鈕功能
startCameraWithTimeout();



// 將條碼添加到表格
function addBarcodeToTable(originalBarcode, price, quantity, newBarcodeText) {
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
    barcodeCell.textContent = originalBarcode;

    // 創建數字輸入框
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.value = price;
    priceInput.style.width = '60px';
    priceInput.addEventListener('change', function() {
        updateBarcode(newRow, originalBarcode, priceInput.value, quantityInput.value);
    });
    priceCell.appendChild(priceInput);

    // 創建數字輸入框
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.value = quantity;
    quantityInput.style.width = '60px';
    quantityInput.addEventListener('change', function() {
        updateBarcode(newRow, originalBarcode, priceInput.value, quantityInput.value);
    });
    quantityCell.appendChild(quantityInput);

    // 創建小記文字
    const subtotalText = document.createElement('span');
    subtotalText.textContent = price * quantity;
    subtotalText.style.margin = '5px';
    subtotalCell.appendChild(subtotalText);

    // 創建條碼圖片
    const barcodeImage = document.createElement('img');
    JsBarcode(barcodeImage, newBarcodeText, {
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
    deleteButton.addEventListener('click', function() {
        table.deleteRow(newRow.rowIndex - 1);
    });
    actionCell.appendChild(deleteButton);

    updateTotal();
}

// 更新條碼
function updateBarcode(row, originalBarcode, price, quantity) {
    // 創建小記文字
    const subtotalCell = row.cells[3];
    subtotalCell.innerHTML = ''; // 清空原有內容
    const subtotalText = document.createElement('span');
    subtotalText.textContent = price * quantity;
    subtotalText.style.margin = '5px';
    subtotalCell.appendChild(subtotalText);

    const newBarcodeText = `${originalBarcode} +${quantity}`;

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