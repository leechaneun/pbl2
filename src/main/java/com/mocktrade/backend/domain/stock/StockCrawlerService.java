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



@Slf4j
@Service
@RequiredArgsConstructor
public class StockCrawlerService {

    private final StockRepository stockRepository;

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

    @Scheduled(fixedRate = 30000)
    @Transactional
    public void refreshMarketPrices() {
        log.info("========== 실시간 주가 데이터 동기화 시작 =========="); // 시작 로그

        for (String code : codes) {
            String URL = "https://finance.naver.com/item/main.naver?code=" + code;

            try {
                Document doc = Jsoup.connect(URL).get();
                Elements todaylist = doc.select(".new_totalinfo dl>dd");

                if (todaylist.size() > 3) {
                    String name = todaylist.get(1).text().split(" ")[1];
                    String juga = todaylist.get(3).text().split(" ")[1];
                    String rate = todaylist.get(3).text().split(" ")[6];

                    updateStockPrice(code, name, juga, rate);
                }

                Thread.sleep(150);

            } catch (IOException | InterruptedException e) {
                log.error("크롤링 에러 [코드: {}]: {}", code, e.getMessage());
            }
        }

        log.info("========== 실시간 주가 데이터 동기화 완료 =========="); // 최종 완료 로그만 info로!
    }

    private void updateStockPrice(String code, String name, String juga, String rate) {
        Stock stock = stockRepository.findByStockCode(code)
                .orElse(new Stock(code, name, 0L));

        try {
            String cleanJuga = juga.replaceAll("[^0-9]", "");
            Long currentPrice = Long.parseLong(cleanJuga);

            String rateValue = rate.replaceAll("[^0-9.\\-]", "");
            if (rateValue.isEmpty() || rateValue.equals("-") || rateValue.equals(".")) {
                rateValue = "0.0";
            }
            Double changeRate = Double.parseDouble(rateValue);

            stock.setStockName(name);
            stock.setCurrentPrice(currentPrice);
            stock.setChangeRate(changeRate);
            stock.setLastUpdated(LocalDateTime.now());

            stockRepository.save(stock);

            // 개별 성공 로그는 debug로 설정해서 평소엔 안 보이게 합니다.
            log.debug("업데이트 성공: {}", name);

        } catch (Exception e) {
            log.error("데이터 변환 실패 [종목: {}]: {}", name, e.getMessage());
        }
    }
}