import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import 'jquery-ui/ui/widgets/autocomplete';
import './App.css';

const App = () => {
  const [stockName, setStockName] = useState('');
  const [stockFound, setStockFound] = useState(true); // 주식 발견 여부 상태 추가

  useEffect(() => {
    loadReviews();

    $('#stockName').autocomplete({
      source: (request, response) => {
        $.ajax({
          url: 'http://localhost:8080/api/get_tickers',
          method: 'GET',
          dataType: 'json',
          success: (data) => {
            const filteredData = data.filter(item =>
              item.Symbol.toUpperCase().includes(request.term.toUpperCase()) ||
              item.Name.toUpperCase().includes(request.term.toUpperCase())
            ).map(item => ({
              label: `${item.Symbol} - ${item.Name} - ${item.Market} - ${item.Sector} - ${item.Industry}`,
              value: item.Symbol
            }));
            response(filteredData);
          },
          error: () => {
            console.error('Error fetching tickers');
          }
        });
      },
      select: (event, ui) => {
        setStockName(ui.item.value);
        $('#searchReviewButton').click();
        return false;
      }
    });

    $('#stockName').on('input', function () {
      this.value = this.value.toUpperCase();
    });

    $('#stockName').on('keypress', function (e) {
      if (e.which === 13) {
        $('#searchReviewButton').click();
        return false;
      }
    });

    $('#searchReviewButton').click(() => {
      searchReview(stockName);
    });
  }, [stockName]);

  const loadReviews = () => {
    const reviewList = $('#reviewList');
    $.getJSON('https://api.github.com/repos/photo2story/my-react-app/contents/', (data) => {
      data.forEach(file => {
        if (file.name.startsWith('comparison_') && file.name.endsWith('.png')) {
          const stockName = file.name.replace('comparison_', '').replace('_VOO.png', '').toUpperCase();
          const newReview = $(`
            <div class="review">
              <h3>${stockName} vs VOO</h3>
              <img id="image-${stockName}" src="${file.download_url}" alt="${stockName} vs VOO" style="width: 100%;">
            </div>
          `);
          reviewList.append(newReview);
          $(`#image-${stockName}`).on('click', () => {
            showMplChart(stockName);
          });
        }
      });
    }).fail(() => {
      console.error('Error fetching the file list');
    });
  };

  const showMplChart = (stockName) => {
    const url = `https://raw.githubusercontent.com/photo2story/my-react-app/main/result_mpl_${stockName}.png`;
    window.open(url, '_blank');
  };

  const searchReview = (stockName) => {
    const reviewList = $('#reviewList');
    const reviewItems = reviewList.find('.review');
    let stockFound = false;

    reviewItems.each(function () {
      const reviewItem = $(this);
      if (reviewItem.find('h3').text().includes(stockName)) {
        reviewItem[0].scrollIntoView({ behavior: 'smooth' });
        stockFound = true;
        return false;
      }
    });

    setStockFound(stockFound); // 주식 발견 여부 설정

    if (!stockFound) {
      checkStockImageAndExecuteCommand(stockName);
    }
  };

  const checkStockImageAndExecuteCommand = (stockName) => {
    $.ajax({
      url: `/check_stock_image/${stockName}`,
      method: 'GET',
      success: (data) => {
        if (data.exists) {
          window.location.href = data.url;
        } else {
          alert('이미지를 찾을 수 없습니다. 디스코드 명령을 실행합니다.');
          $.ajax({
            url: '/execute_discord_command',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ stock_name: stockName })
          });
        }
      },
      error: () => {
        console.error('Error checking stock image');
      }
    });
  };

  return (
    <div className="App">
      <h1>Stock Comparison Review</h1>
      <div>
        <label htmlFor="stockName">Stock name:</label>
        <input
          type="text"
          id="stockName"
          value={stockName}
          onChange={e => setStockName(e.target.value)}
        />
        <button id="searchReviewButton">Search Review</button>
      </div>
      {!stockFound && <div style={{ color: 'red' }}>해당 주식 리뷰를 찾을 수 없습니다.</div>} {/* 주식이 없는 경우 경고 메시지 표시 */}
      <div id="reviewList"></div>
    </div>
  );
};

export default App;
