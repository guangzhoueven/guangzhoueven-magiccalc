(function() {
  // ===================== 计算器状态 =====================
  let currentInput = '0';        // 当前输入
  let previousInput = '';        // 上一个操作数
  let operator = '';             // 当前运算符
  let shouldResetInput = false;  // 是否需要重置输入
  let expression = '';           // 表达式显示
  let lastResult = null;         // 上次计算结果
  let justCalculated = false;    // 刚完成计算

  // ===================== 魔术状态 =====================
  let magicPhase = 0;            // 魔术阶段：0=未开始，1=第一阶段完成，2=第二阶段
  let firstResult = 0;           // 第一阶段的计算结果
  let magicSequence = [];        // 魔术数字序列
  let magicIndex = 0;            // 当前魔术数字索引
  let targetTime = 0;            // 目标时间值
  
  // ===================== 全屏状态 =====================
  let fullscreenSequence = '';   // 全屏按键序列
  const FULLSCREEN_CODE = '0123456789'; // 全屏触发序列

  // ===================== DOM 元素 =====================
  const resultEl = document.getElementById('result');
  const expressionEl = document.getElementById('expression');
  const btnClear = document.getElementById('btnClear');
  const lockIndicator = document.getElementById('lockIndicator');

  // ===================== 状态栏时钟 =====================
  function updateStatusTime() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('statusTime').textContent = h + ':' + m;
  }
  updateStatusTime();
  setInterval(updateStatusTime, 10000);

  // ===================== 显示更新 =====================
  function updateDisplay() {
    let displayText = currentInput;
    
    // 格式化数字显示（添加千分位逗号）
    displayText = formatNumber(displayText);
    
    resultEl.textContent = displayText;
    
    // 根据长度调整字号
    const len = currentInput.replace(/[^0-9.]/g, '').length;
    resultEl.classList.remove('small', 'xsmall');
    if (len > 10) {
      resultEl.classList.add('xsmall');
    } else if (len > 7) {
      resultEl.classList.add('small');
    }

    expressionEl.textContent = expression;
    
    // 更新AC/C按钮
    btnClear.textContent = (currentInput === '0' && !operator) ? 'AC' : 'C';
  }

  function formatNumber(numStr) {
    if (numStr === 'Error' || numStr === 'Infinity' || numStr === '-Infinity') return numStr;
    
    const isNegative = numStr.startsWith('-');
    let str = isNegative ? numStr.slice(1) : numStr;
    
    const parts = str.split('.');
    let intPart = parts[0];
    const decPart = parts.length > 1 ? '.' + parts[1] : '';
    
    // 添加千分位
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return (isNegative ? '-' : '') + intPart + decPart;
  }

  // ===================== 核心计算 =====================
  function calculate(a, op, b) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    
    if (isNaN(numA) || isNaN(numB)) return 'Error';
    
    let result;
    switch (op) {
      case '+': result = numA + numB; break;
      case '-': case '−': result = numA - numB; break;
      case '×': result = numA * numB; break;
      case '÷':
        if (numB === 0) return 'Error';
        result = numA / numB;
        break;
      default: return 'Error';
    }
    
    // 处理浮点精度
    result = parseFloat(result.toPrecision(12));
    
    // 如果结果是整数，返回整数字符串
    if (Number.isInteger(result)) {
      return result.toString();
    }
    return result.toString();
  }

  // ===================== 获取魔术时间值 =====================
  function getMagicTimeValue() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // 格式：{月}{日}{小时}{分钟}，例如 2月17日23点22分 => 2172322
    const timeStr = '' + month + String(day).padStart(2, '0') + String(hours).padStart(2, '0') + String(minutes).padStart(2, '0');
    return parseInt(timeStr, 10);
  }

  // ===================== 全屏功能 =====================
  function checkFullscreenSequence(digit) {
    fullscreenSequence += digit;
    
    // 保持序列长度不超过目标长度
    if (fullscreenSequence.length > FULLSCREEN_CODE.length) {
      fullscreenSequence = fullscreenSequence.slice(-FULLSCREEN_CODE.length);
    }
    
    // 检查是否匹配全屏序列
    if (fullscreenSequence === FULLSCREEN_CODE) {
      toggleFullscreen();
      fullscreenSequence = ''; // 重置序列
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      // 进入全屏
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
      }
    } else {
      // 退出全屏
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
      }
    }
  }

  // ===================== 魔术逻辑 =====================
  function startMagicPhase1() {
    magicPhase = 1;
    // 重置魔术状态
    magicSequence = [];
    magicIndex = 0;
    lockIndicator.classList.add('locked');
    
  }

  function startMagicPhase2() {
    magicPhase = 2;
    firstResult = parseFloat(currentInput);
    targetTime = getMagicTimeValue();
    
    // 计算需要的魔术数字序列：targetTime - firstResult
    const needed = targetTime - firstResult;
    magicSequence = needed.toString().split('');
    magicIndex = 0;
    
    
    
    // 设置表达式显示当前状态
    expression = firstResult + ' + ';
    currentInput = '0';
    shouldResetInput = true;
    
    updateDisplay();
  }

  function processMagicInput(value) {
    if (magicPhase === 2 && magicIndex < magicSequence.length) {
      // 忽略用户输入，使用魔术数字序列中的下一个数字
      const magicDigit = magicSequence[magicIndex];
      
      if (value === '.' && magicIndex === 0 && currentInput === '0') {
        // 如果用户按小数点，但我们需要的不是小数点，忽略
        return;
      }
      
      // 更新显示为魔术数字
      if (magicIndex === 0) {
        currentInput = magicDigit;
      } else {
        currentInput += magicDigit;
      }
      
      expression = firstResult + ' + ' + currentInput;
      magicIndex++;
      
      updateDisplay();
    }
  }

  // ===================== 按键处理 =====================
  function handleNumber(value) {
    // 检查全屏序列
    if (/^\d$/.test(value)) {
      checkFullscreenSequence(value);
    }
    
    // 如果在魔术第二阶段，处理魔术输入
    if (magicPhase === 2) {
      processMagicInput(value);
      return;
    }

    // 正常数字输入逻辑
    if (shouldResetInput || currentInput === '0') {
      if (value === '.') {
        currentInput = '0.';
      } else {
        currentInput = value;
      }
      shouldResetInput = false;
    } else {
      // 限制输入长度
      if (currentInput.replace('.', '').replace('-', '').length >= 15) return;
      
      // 防止重复小数点
      if (value === '.' && currentInput.includes('.')) return;
      
      currentInput += value;
    }

    if (justCalculated && !operator) {
      expression = '';
      justCalculated = false;
    }

    updateDisplay();
  }

  function handleOperator(op) {
    // 如果在魔术第一阶段且用户按+，开始魔术流程
    if (magicPhase === 1 && op === '+') {
      startMagicPhase2();
      return;
    }

    // 正常运算符逻辑
    if (operator && !shouldResetInput) {
      // 有上一个运算，先计算
      const result = calculate(previousInput, operator, currentInput);
      if (result === 'Error') {
        currentInput = 'Error';
        previousInput = '';
        operator = '';
        expression = '';
        updateDisplay();
        return;
      }
      expression = result + ' ' + op;
      previousInput = result;
      currentInput = result;
    } else {
      expression = currentInput + ' ' + op;
      previousInput = currentInput;
    }

    operator = op;
    shouldResetInput = true;
    justCalculated = false;
    lastResult = null;
    
    // 取消运算符高亮
    document.querySelectorAll('.btn-op').forEach(b => b.classList.remove('active'));
    // 高亮当前运算符
    document.querySelectorAll('.btn-op').forEach(b => {
      if (b.dataset.value === op) b.classList.add('active');
    });

    updateDisplay();
  }

  function handleEquals() {
    // 如果在魔术第二阶段，完成魔术
    if (magicPhase === 2) {
      // 确保所有魔术数字都已输入
      while (magicIndex < magicSequence.length) {
        const magicDigit = magicSequence[magicIndex];
        if (magicIndex === 0) {
          currentInput = magicDigit;
        } else {
          currentInput += magicDigit;
        }
        magicIndex++;
      }
      
      expression = firstResult + ' + ' + currentInput + ' =';
      currentInput = targetTime.toString();
      
      // 重置魔术状态
      magicPhase = 0;
      lockIndicator.classList.remove('locked');
      shouldResetInput = true;
      justCalculated = true;
      
      updateDisplay();
      return;
    }

    // 正常等号逻辑
    if (operator && previousInput !== '' && !shouldResetInput) {
      // 有运算符且用户已输入了新数字，执行计算
      const result = calculate(previousInput, operator, currentInput);
      if (result === 'Error') {
        currentInput = 'Error';
        expression = '';
        operator = '';
        previousInput = '';
        updateDisplay();
        return;
      }
      expression = previousInput + ' ' + operator + ' ' + currentInput + ' =';
      currentInput = result;
      previousInput = '';
      operator = '';
      lastResult = parseFloat(result);
      
      // 计算完成后，如果还没有进入魔术阶段，开始魔术第一阶段
      if (magicPhase === 0) {
        startMagicPhase1();
      }
    } else {
      // 没有待计算的表达式
      if (operator) {
        expression = '';
        previousInput = '';
        operator = '';
      } else {
        expression = currentInput + ' =';
      }
      lastResult = parseFloat(currentInput);
    }

    // 取消运算符高亮
    document.querySelectorAll('.btn-op').forEach(b => b.classList.remove('active'));

    shouldResetInput = true;
    justCalculated = true;
    updateDisplay();
  }

  function handleClear() {
    // 重置所有状态
    currentInput = '0';
    previousInput = '';
    operator = '';
    expression = '';
    shouldResetInput = false;
    lastResult = null;
    justCalculated = false;
    
    // 重置魔术状态
    magicPhase = 0;
    firstResult = 0;
    magicSequence = [];
    magicIndex = 0;
    targetTime = 0;
    
    // 重置全屏序列
    fullscreenSequence = '';
    
    lockIndicator.classList.remove('locked');
    document.querySelectorAll('.btn-op').forEach(b => b.classList.remove('active'));
    
    updateDisplay();
  }

  function handleBackspace() {
    // 如果在魔术第二阶段，忽略退格
    if (magicPhase === 2) {
      return;
    }

    if (currentInput === 'Error') {
      currentInput = '0';
    } else if (shouldResetInput) {
      return; // 刚完成计算或选择了运算符，退格无效
    } else if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
      if (currentInput === '-') currentInput = '0';
    } else {
      currentInput = '0';
    }
    
    updateDisplay();
  }

  function handlePercent() {
    // 如果在魔术第二阶段，忽略百分号
    if (magicPhase === 2) {
      return;
    }

    const num = parseFloat(currentInput);
    if (isNaN(num)) return;
    
    if (operator && previousInput) {
      const base = parseFloat(previousInput);
      currentInput = (base * num / 100).toString();
    } else {
      currentInput = (num / 100).toString();
    }
    
    updateDisplay();
  }

  // ===================== 事件绑定 =====================
  document.querySelectorAll('.btn').forEach(btn => {
    // 点击波纹效果
    btn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 400);
    });

    // 按钮功能
    btn.addEventListener('click', function() {
      const action = this.dataset.action;
      const value = this.dataset.value;

      switch (action) {
        case 'number':
          handleNumber(value);
          break;
        case 'operator':
          handleOperator(value);
          break;
        case 'equals':
          handleEquals();
          break;
        case 'clear':
          handleClear();
          break;
        case 'backspace':
          handleBackspace();
          break;
        case 'percent':
          handlePercent();
          break;
      }
    });
  });

  // 键盘支持
  document.addEventListener('keydown', function(e) {
    if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
    else if (e.key === '.') handleNumber('.');
    else if (e.key === '+') handleOperator('+');
    else if (e.key === '-') handleOperator('-');
    else if (e.key === '*') handleOperator('×');
    else if (e.key === '/') { e.preventDefault(); handleOperator('÷'); }
    else if (e.key === 'Enter' || e.key === '=') handleEquals();
    else if (e.key === 'Backspace') handleBackspace();
    else if (e.key === 'Escape') handleClear();
    else if (e.key === '%') handlePercent();
  });

  // 初始显示
  updateDisplay();
})();