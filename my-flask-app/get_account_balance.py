### get_account_balance.py


import pprint
import mojito
import os
import pandas as pd
from tabulate import tabulate
import yfinance as yf
import requests

def get_balance(key, secret, acc_no):
    broker = mojito.KoreaInvestment(
        api_key=key,
        api_secret=secret,
        acc_no=acc_no,
    )
  
    # 미국주식
    balance_US = broker.fetch_present_balance()
    # pprint.pprint(balance_US)
    output1_list_US = [
        {
            'ticker': comp['pdno'],
            'name': comp['prdt_name'],
            'profit_amount': comp['frcr_evlu_amt2'],
            'average_price': comp['frcr_pchs_amt'],
            'holding_quantity': comp.get('ccld_qty_smtl1', '0'),  # 보유수량 매도가능수량
            'profit_rate': comp['evlu_pfls_rt1'],  # 수익률 for US stocks
            'current_price': float(comp.get('ovrs_now_pric1', 0)),  # 현재가격
        }
        for comp in balance_US['output1']
    ]
    # 한국주식
    balance_KR = broker.fetch_balance()
    # pprint.pprint(balance_KR)
    output1_list_KR = [
        {
            'ticker': comp['pdno'],
            'name': comp['prdt_name'],
            'profit_amount': comp['evlu_amt'],
            'average_price': comp['pchs_amt'],
            'holding_quantity': comp.get('ord_psbl_qty', '0'),  # 보유수량 매도가능, 한국주식
            'profit_rate': comp['evlu_pfls_rt'],  # 수익률 for Korean stocks
            'current_price': float(comp.get('prpr', 0)) / 1000,  # 현재가격, 한국주식
        }
        for comp in balance_KR['output1']
    ]
    # Combine US and KR balances into one list
    combined_balance = output1_list_US + output1_list_KR
  
    return combined_balance

  
# 사용가능한 예수금 가져오기
def calculate_buyable_balance(key,secret,acc_no):
    broker = mojito.KoreaInvestment(
      api_key=key,
      api_secret=secret,
      acc_no=acc_no,
    )
  
    balance = broker.fetch_present_balance()
  
    # output2가 비어있는 경우 0을 반환하도록 수정
    if not balance['output2']:
        # return 0, 0, 0, 0  # 반환 값이 4개인 튜플로 수정
        us_psbl_amt = 0
    else:
        us_psbl_amt = float(balance['output2'][0].get('nxdy_frcr_drwg_psbl_amt', '0'))  # 외화예수금

    won_psbl_amt = float(balance['output3'].get('wdrw_psbl_tot_amt', '0').replace(',', ''))  # 원화예수금
    print(f'won_psbl_amt: {won_psbl_amt}')
    print(f'us_psbl_amt: {us_psbl_amt}')  # 수정된 부분
  
    frst_bltn_exrt = float(balance['output1'][0]['bass_exrt'])  # 환율
  
    buyable_balance = (us_psbl_amt + won_psbl_amt / frst_bltn_exrt)
    return won_psbl_amt, us_psbl_amt, frst_bltn_exrt, buyable_balance
  



# 미국 주식 마켓을 파악해서 매수가능수량 가져오기
def get_ticker_info(key,secret,acc_no,exchange,ticker,price,quantity):
    broker = mojito.KoreaInvestment(key, secret, acc_no, exchange)
    resp = broker.create_limit_buy_order(ticker, price, quantity)
    # print(resp)

    return resp

# 미국 주식 마켓정보(나스닥,뉴욕) 가져오기

def get_market_from_ticker(ticker):
    # us_stock_market.csv 파일을 읽어옵니다.
    df = pd.read_csv('stock_market.csv')
    #print(df)
    # ticker를 대문자로 변환하여 일치 여부를 확인합니다.
    ticker = ticker.upper()

    # ticker와 일치하는 row를 찾습니다.
    row = df[df['Symbol'] == ticker]

    if not row.empty:
        market = row['Market'].values[0]
        return market
    else:
        return "알 수 없는 마켓"

# 미국, 한국 주식 가격 가져오기
def get_ticker_price(key, secret, acc_no, exchange, ticker):
    if 'KOSPI' in exchange or 'KOSDAQ' in exchange:
        # 한국 주식의 경우 ticker에서 .KS 제거
        ticker = ticker.replace(".KS", "")
        ticker = ticker.replace(".KQ", "")
      
        broker = mojito.KoreaInvestment(
            api_key=key,
            api_secret=secret,
            acc_no=acc_no,
        )

        price_data = broker.fetch_price(ticker)
        last_price = price_data['output']['stck_oprc']

    else:
        if exchange == 'NASDAQ':
            exchange = '나스닥'
        elif exchange == 'NYSE':
            exchange = '뉴욕'
        elif exchange == 'AMEX':
            exchange = '아멕스'

        broker = mojito.KoreaInvestment(
            api_key=key,
            api_secret=secret,
            acc_no=acc_no,
            exchange=exchange
        )

        price_data = broker.fetch_price(ticker)
        # print(price_data)
        last_price = price_data['output']['last']
        if last_price == None:
          stock = yf.Ticker(ticker)
          last_price = stock.history(period='1d')['Close'][0]

    print(f"Last price for {ticker} on {exchange}: {last_price}")
    return last_price


def get_ticker_from_korean_name(korean_name):
  # stock_market.csv 파일을 읽어옵니다.
  df = pd.read_csv('stock_market.csv')

  # 한국 주식 이름을 대문자로 변환하여 일치 여부를 확인합니다.
  # korean_name = korean_name.upper()

  # korean_name과 일치하는 row를 찾습니다.
  row = df[df['Name'].str.upper() == korean_name]

  if not row.empty:
      ticker = row['Symbol'].values[0]
      print(f"k_stock {ticker} : {ticker}")
      return ticker
  else:
      return None

# 테스트 코드
if __name__ == "__main__":
    key = os.environ['H_APIKEY']
    secret = os.environ['H_SECRET']
    acc_no = os.environ['H_ACCOUNT']
    ACC_NO_8 = os.environ['H_ACCOUNT_8']
    # Discord 봇 토큰 및 채널 ID 가져오기
    TOKEN = os.environ['DISCORD_APPLICATION_TOKEN']
    channel_id = os.environ['DISCORD_CHANNEL_ID']

    # output1_list = get_balance(key,secret,acc_no)
    # pprint.pprint(output1_list)


    get_balance(key,secret,acc_no)()

                               