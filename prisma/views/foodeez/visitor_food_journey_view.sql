SELECT
  `foodeez`.`visitor_food_journey`.`VISITOR_FOOD_JOURNEY_ID` AS `VISITOR_FOOD_JOURNEY_ID`,
  `foodeez`.`visitor_food_journey`.`VISITORS_ACCOUNT_ID` AS `VISITORS_ACCOUNT_ID`,
  IFNULL(
    `foodeez`.`visitor_food_journey`.`VISITOR_NAME`,
    'Guest'
  ) AS `VISITOR_NAME`,
  `foodeez`.`visitor_food_journey`.`VISITOR_PIC` AS `VISITOR_PIC`,
  IFNULL(
    `foodeez`.`visitor_food_journey`.`VISITOR_EMAIL_ADDRESS`,
    'Not Available'
  ) AS `VISITOR_EMAIL_ADDRESS`,
  `foodeez`.`visitor_food_journey`.`TITLE` AS `TITLE`,
  `foodeez`.`visitor_food_journey`.`DESCRIPTION` AS `DESCRIPTION`,
  IFNULL(
    `foodeez`.`visitor_food_journey`.`RESTAURANT_NAME`,
    'Not Mentioned'
  ) AS `RESTAURANT_NAME`,
  `foodeez`.`visitor_food_journey`.`ADDRESS_GOOGLE_URL` AS `ADDRESS_GOOGLE_URL`,
  `foodeez`.`visitor_food_journey`.`PIC_1` AS `PIC_1`,
  `foodeez`.`visitor_food_journey`.`PIC_2` AS `PIC_2`,
  `foodeez`.`visitor_food_journey`.`PIC_3` AS `PIC_3`,
  `foodeez`.`visitor_food_journey`.`APPROVED` AS `APPROVED`
FROM
  `foodeez`.`visitor_food_journey`
ORDER BY
  `foodeez`.`visitor_food_journey`.`CREATION_DATETIME` DESC