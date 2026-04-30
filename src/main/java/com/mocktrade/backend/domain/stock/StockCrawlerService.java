package com.mocktrade.backend.domain.stock;


import lombok.RequiredArgsConstructor;

import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;



//크롤링 방법 https://jul-liet.tistory.com/209 참고




import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockCrawlerService {

    private final StockRepository stockRepository;

    // 종목 코드 리스트
    private final List<String> codes = Arrays.asList(
            "005930", "000660", "066570", "005490", "035420",
            "035720", "323410", "181710", "373220", "006400",
            "086520", "247540", "003670", "005380", "000270",
            "012330", "105560", "055550", "086790", "316140",
            "207940", "068270", "000100", "128940", "352820",
            "035900", "041510", "259960", "036570", "263750",
            "139480", "090430", "004370", "034020", "064350",
            "066970", "112040", "000990", "058470", "003490"
    );

    @Scheduled(fixedRate = 30000) // 30초마다 실행[cite: 2]
    public void refreshMarketPrices() {
        log.info("========== 실시간 주가 데이터 동기화 시작 ==========");

        for (String code : codes) {
            String URL = "https://finance.naver.com/item/main.naver?code=" + code;

            try {
                Document doc = Jsoup.connect(URL).get();
                Elements todaylist = doc.select(".new_totalinfo dl>dd");

                if (todaylist.size() > 3) {
                    // 네이버 금융 데이터 파싱[cite: 2]
                    String name = todaylist.get(1).text().split(" ")[1];
                    String juga = todaylist.get(3).text().split(" ")[1];
                    String rate = todaylist.get(3).text().split(" ")[6];

                    updateStockPrice(code, name, juga, rate);
                }

                Thread.sleep(150); // 서버 부하 방지[cite: 2]

            } catch (IOException | InterruptedException e) {
                log.error("크롤링 에러 [코드: {}]: {}", code, e.getMessage());
            }
        }

        log.info("========== 실시간 주가 데이터 동기화 완료 ==========");
    }

    private void updateStockPrice(String code, String name, String juga, String rate) {
        // 기존 종목이 없으면 Builder를 통해 새로 생성[cite: 1, 2]
        Stock stock = stockRepository.findByStockCode(code)
                .orElseGet(() -> Stock.builder()
                        .stockCode(code)
                        .stockName(name)
                        .currentPrice(0L)
                        .changeRate(0.0)
                        .build());

        try {
            // 가격 데이터 정제 (숫자 외 제거)[cite: 2]
            String cleanJuga = juga.replaceAll("[^0-9]", "");
            Long currentPrice = Long.parseLong(cleanJuga);

            // 등락률 데이터 정제[cite: 2]
            String rateValue = rate.replaceAll("[^0-9.\\-]", "");
            if (rateValue.isEmpty() || rateValue.equals("-") || rateValue.equals(".")) {
                rateValue = "0.0";
            }
            Double changeRate = Double.parseDouble(rateValue);

            // 엔티티 필드 업데이트[cite: 1, 2]
            stock.setStockName(name);
            stock.setCurrentPrice(currentPrice);
            stock.setChangeRate(changeRate);
            stock.setLastUpdated(LocalDateTime.now());

            stockRepository.save(stock);
            log.debug("업데이트 성공: {}", name);

        } catch (Exception e) {
            log.error("데이터 변환 실패 [종목: {}]: {}", name, e.getMessage());
        }
    }
}