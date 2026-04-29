package com.mocktrade.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class MockTradeApplication {

	public static void main(String[] args) {
		// [범인 검거!] 아래 코드가 properties 설정을 덮어쓰고 있었습니다.
		// 로컬 DB를 쓰려면 이 부분을 지워야 합니다.
       /* System.setProperty(
             "spring.data.mongodb.uri",
             "mongodb+srv://mocktrade:pbl2@cluster0.fjpzs9e.mongodb.net/mocktrade?retryWrites=true&w=majority"
       );
       */

		SpringApplication.run(MockTradeApplication.class, args);
	}
}