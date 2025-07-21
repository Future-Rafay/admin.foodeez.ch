SELECT
  `a`.`BUSINESS_ID` AS `BUSINESS_ID`,
  `a`.`BUSINESS_NAME` AS `BUSINESS_NAME`,
  `a`.`SHORT_NAME` AS `SHORT_NAME`,
  `a`.`DESCRIPTION` AS `DESCRIPTION`,
  `a`.`ADDRESS_STREET` AS `ADDRESS_STREET`,
  `a`.`ADDRESS_ZIP` AS `ADDRESS_ZIP`,
  `a`.`ADDRESS_TOWN` AS `ADDRESS_TOWN`,
  `a`.`ADDRESS_CITY_ID` AS `ADDRESS_CITY_ID`,
  `c`.`CITY_CODE` AS `CITY_CODE`,
  `c`.`CITY_NAME` AS `CITY_NAME`,
  `a`.`EMAIL_ADDRESS` AS `EMAIL_ADDRESS`,
  `a`.`ADDRESS_COUNTRY` AS `ADDRESS_COUNTRY`,
  `a`.`PHONE_NUMBER` AS `PHONE_NUMBER`,
  `a`.`WHATSAPP_NUMBER` AS `WHATSAPP_NUMBER`,
  `a`.`WEB_ADDRESS` AS `WEB_ADDRESS`,
  `a`.`LOGO` AS `LOGO`,
  `a`.`FACEBOOK_LINK` AS `FACEBOOK_LINK`,
  `a`.`INSTA_LINK` AS `INSTA_LINK`,
  `a`.`TIKTOK_LINK` AS `TIKTOK_LINK`,
  `a`.`GOOGLE_PROFILE` AS `GOOGLE_PROFILE`,
  `a`.`IMAGE_URL` AS `IMAGE_URL`,
  `a`.`GOOGLE_RATING` AS `GOOGLE_RATING`,
  `a`.`APPROVED` AS `APPROVED`,
  `a`.`STATUS` AS `STATUS`,
  IFNULL(`d`.`RANKING`, 0) AS `RANKING`,
(
    CASE
      WHEN (`vegan`.`FOOD_TYPE_ID` IS NULL) THEN 0
      ELSE 1
    END
  ) AS `VEGAN`,
(
    CASE
      WHEN (`veg`.`FOOD_TYPE_ID` IS NULL) THEN 0
      ELSE 1
    END
  ) AS `VEGETARIAN`,
(
    CASE
      WHEN (`halal`.`FOOD_TYPE_ID` IS NULL) THEN 0
      ELSE 1
    END
  ) AS `HALAL`,
(
    CASE
      WHEN (
        (`a`.`EMAIL_ADDRESS` IS NULL)
        OR (0 <> length((`a`.`EMAIL_ADDRESS` = 0)))
      ) THEN 0
      ELSE 1
    END
  ) AS `CAN_RESERVE_TABLE`,
(
    CASE
      WHEN (`foodeez`.`menu`.`BUSINESS_ID` IS NULL) THEN 0
      ELSE 1
    END
  ) AS `HAVING_ACTIVE_MENU_CARD`
FROM
  (
    (
      (
        (
          (
            (
              `foodeez`.`business` `a`
              LEFT JOIN `foodeez`.`city` `c` ON((`a`.`ADDRESS_CITY_ID` = `c`.`CITY_ID`))
            )
            LEFT JOIN `foodeez`.`foodeez_ranking` `d` ON((`a`.`BUSINESS_ID` = `d`.`BUSINESS_ID`))
          )
          LEFT JOIN `foodeez`.`business_2_food_type` `vegan` ON(
            (
              (`a`.`BUSINESS_ID` = `vegan`.`BUSINESS_ID`)
              AND (`vegan`.`FOOD_TYPE_ID` = 1)
            )
          )
        )
        LEFT JOIN `foodeez`.`business_2_food_type` `veg` ON(
          (
            (`a`.`BUSINESS_ID` = `veg`.`BUSINESS_ID`)
            AND (`veg`.`FOOD_TYPE_ID` = 2)
          )
        )
      )
      LEFT JOIN `foodeez`.`business_2_food_type` `halal` ON(
        (
          (`a`.`BUSINESS_ID` = `halal`.`BUSINESS_ID`)
          AND (`halal`.`FOOD_TYPE_ID` = 3)
        )
      )
    )
    LEFT JOIN `foodeez`.`business_having_active_menu_card_view` `menu` ON(
      (
        `foodeez`.`menu`.`BUSINESS_ID` = `a`.`BUSINESS_ID`
      )
    )
  )