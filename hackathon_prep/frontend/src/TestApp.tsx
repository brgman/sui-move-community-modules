import React from 'react';

function TestApp() {
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ color: 'blue' }}>🎮 Тестовая страница</h1>
            <p>Если вы видите этот текст, то React работает!</p>
            <div style={{
                backgroundColor: '#f0f8ff',
                padding: '20px',
                borderRadius: '8px',
                border: '2px solid #4169e1'
            }}>
                <h2>✅ Проверка работы:</h2>
                <ul>
                    <li>React приложение загружено</li>
                    <li>Vite dev server работает</li>
                    <li>TypeScript компилируется</li>
                </ul>
            </div>
        </div>
    );
}

export default TestApp;
