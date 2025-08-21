<?php
session_start();
require_once 'config.php';


if (isset($_GET['logout'])) { session_destroy(); header('Location: index.php'); exit; }
$is_logged_in = isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
$error_message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') { if (isset($_POST['code']) && $_POST['code'] === SECRET_CODE) { $_SESSION['logged_in'] = true; header('Location: index.php'); exit; } else { $error_message = 'Неверный код доступа'; } }
if (isset($_GET['api'])) { if (!$is_logged_in) { http_response_code(403); echo json_encode(['error' => 'Not authorized']); exit; } $dataFile = 'data.json'; if ($_GET['api'] === 'load') { header('Content-Type: application/json'); if (file_exists($dataFile)) { echo file_get_contents($dataFile); } else { echo json_encode(['salary' => 0, 'monthlyPayments' => 0, 'entries' => []]); } } if ($_GET['api'] === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') { $input = file_get_contents('php://input'); $data = json_decode($input, true); if (json_last_error() === JSON_ERROR_NONE) { file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)); echo json_encode(['success' => true]); } else { http_response_code(400); echo json_encode(['error' => 'Invalid JSON']); } } exit; }
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Финансовый Менеджер</title>
    <link rel="stylesheet" href="style.css?v=<?= time(); ?>">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>

<div class="container">
    <?php if ($is_logged_in): ?>
        <button id="logout-btn" class="logout-btn">Выйти</button>
        <div id="app">
            <div class="card summary-panel">
                <div class="main-inputs">
                    <div class="input-group">
                        <label>Доход в месяц</label>
                        <input type="number" id="salary-input" value="96000">
                    </div>
                    <div class="input-group">
                        <label>Ежемес. платежи</label>
                        <input type="number" id="monthly-payments-input" value="5000">
                    </div>
                </div>
                <div class="summary-grid">
                    <div class="summary-item"><h3>Чистый дневной доход</h3><p id="daily-income">0 ₽</p></div>
                    <div class="summary-item"><h3>Средняя динамика</h3><p id="avg-savings">0 ₽</p></div>
                    <div class="summary-item"><h3>Прогноз на месяц</h3><p id="projection">0 ₽</p></div>
                    <div class="summary-item"><h3>Баланс накопленного</h3><p id="accumulated-balance">0 ₽</p></div>
                    <div class="summary-item">
                        <h3>Прогноз на <input type="number" id="projection-days-input" value="60"> дней</h3>
                        <p id="custom-projection">0 ₽</p>
                    </div>
                </div>
            </div>
            
            <div class="card chart-container">
                <canvas id="dynamics-chart"></canvas>
            </div>

            <div class="card add-entry-card">
                <input type="date" id="new-entry-date" title="Дата расхода">
                <input type="number" id="new-entry-expense" placeholder="Сумма расхода">
                <button id="add-entry-btn">Добавить</button>
            </div>

            <div id="days-container" class="days-container">
                <!-- Сюда загружаются записи о расходах -->
            </div>
        </div>
        <script src="script.js?v=<?= time(); ?>"></script>
    <?php else: ?>
        <div class="login-form card">
            <h1>Финансовый Менеджер</h1>
            <p>Введите код доступа</p>
            <form method="POST" action="index.php">
                <input type="password" name="code" placeholder="••••••••" required><br>
                <button type="submit">Войти</button>
            </form>
            <?php if ($error_message): ?><p class="error-message"><?= htmlspecialchars($error_message) ?></p><?php endif; ?>
        </div>
    <?php endif; ?>
</div>

</body>
</html>