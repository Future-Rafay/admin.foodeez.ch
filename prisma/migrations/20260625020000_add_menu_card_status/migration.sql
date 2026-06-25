ALTER TABLE `business_food_menu_card`
ADD COLUMN `STATUS` TINYINT NOT NULL DEFAULT 1;

UPDATE `business_food_menu_card`
SET `STATUS` = 1
WHERE `STATUS` IS NULL;

CREATE OR REPLACE VIEW `business_food_menu_card_view` AS
SELECT
  row_number() OVER (
    ORDER BY
      `x`.`BUSINESS_ID`,
      `y`.`BUSINESS_FOOD_MENU_CARD_ID`
  ) AS `ROW_NUMBER`,
  `x`.`BUSINESS_ID` AS `BUSINESS_ID`,
  `x`.`BUSINESS_NAME` AS `BUSINESS_NAME`,
  `x`.`DESCRIPTION` AS `DESCRIPTION`,
  `x`.`ADDRESS_STREET` AS `ADDRESS_STREET`,
  `x`.`ADDRESS_ZIP` AS `ADDRESS_ZIP`,
  `x`.`ADDRESS_TOWN` AS `ADDRESS_TOWN`,
  `x`.`PHONE_NUMBER_SHORT` AS `PHONE_NUMBER_SHORT`,
  `x`.`EMAIL_ADDRESS` AS `EMAIL_ADDRESS`,
  `x`.`WHATSAPP_NUMBER` AS `WHATSAPP_NUMBER`,
  `x`.`WEB_ADDRESS` AS `WEB_ADDRESS`,
  `x`.`LOGO` AS `LOGO`,
  `x`.`GOOGLE_PROFILE` AS `GOOGLE_PROFILE`,
  `x`.`IMAGE_URL` AS `IMAGE_URL`,
  `y`.`BUSINESS_FOOD_MENU_CARD_ID` AS `BUSINESS_FOOD_MENU_CARD_ID`,
  `y`.`TITLE` AS `MENU_NAME`
FROM
  (
    `foodeez`.`business` `x`
    LEFT JOIN `foodeez`.`business_food_menu_card` `y` ON(
      (
        (`x`.`BUSINESS_ID` = `y`.`BUSINESS_ID`)
        AND (`y`.`VALID_FROM` <= NOW())
        AND (0 <> IFNULL(`y`.`VALID_TO`,(NOW() >= NOW())))
        AND (IFNULL(`y`.`STATUS`, 1) = 1)
      )
    )
  )
ORDER BY
  `ROW_NUMBER`,
  `y`.`BUSINESS_FOOD_MENU_CARD_ID`;

CREATE OR REPLACE VIEW `business_food_menu_card_detail_view` AS
SELECT
  row_number() OVER (
    ORDER BY
      `f`.`BUSINESS_PRODUCT_ID`
  ) AS `ROW_NUMBER`,
  `x`.`BUSINESS_ID` AS `BUSINESS_ID`,
  `x`.`BUSINESS_NAME` AS `BUSINESS_NAME`,
  `y`.`BUSINESS_FOOD_MENU_CARD_ID` AS `BUSINESS_FOOD_MENU_CARD_ID`,
  `y`.`TITLE` AS `MENU_NAME`,
  `z`.`BUSINESS_PRODUCT_CATEGORY_ID` AS `BUSINESS_PRODUCT_CATEGORY_ID`,
  `b`.`TITLE` AS `CATEGORY`,
  `f`.`BUSINESS_PRODUCT_ID` AS `BUSINESS_PRODUCT_ID`,
  `f`.`TITLE` AS `PRODUCT_NAME`,
  IFNULL(`f`.`DESCRIPTION`, `f`.`TITLE`) AS `PRODUCT_DESCRIPTION`,
  `f`.`PRODUCT_PRICE` AS `PRODUCT_PRICE`,
  `f`.`COMPARE_AS_PRICE` AS `COMPARE_AS_PRICE`,
  IFNULL(`f`.`PIC`, '') AS `PIC`
FROM
  (
    (
      (
        (
          (
            (
              (
                `foodeez`.`business` `x`
                JOIN `foodeez`.`business_food_menu_card` `y`
              )
              JOIN `foodeez`.`business_food_menu_card_detail` `z`
            )
            JOIN `foodeez`.`business_product_category` `b`
          )
          JOIN `foodeez`.`business_product_category_2_tag` `c`
        )
        JOIN `foodeez`.`business_product_tag` `d`
      )
      JOIN `foodeez`.`business_product_2_tag` `e`
    )
    JOIN `foodeez`.`business_product` `f`
  )
WHERE
  (
    (`x`.`BUSINESS_ID` = `y`.`BUSINESS_ID`)
    AND (`y`.`VALID_FROM` <= NOW())
    AND (IFNULL(`y`.`VALID_TO`, NOW()) >= NOW())
    AND (IFNULL(`y`.`STATUS`, 1) = 1)
    AND (
      `y`.`BUSINESS_FOOD_MENU_CARD_ID` = `z`.`BUSINESS_FOOD_MENU_CARD_ID`
    )
    AND (IFNULL(`z`.`STATUS`, 1) = 1)
    AND (`x`.`BUSINESS_ID` = `b`.`BUSINESS_ID`)
    AND (
      `z`.`BUSINESS_PRODUCT_CATEGORY_ID` = `b`.`BUSINESS_PRODUCT_CATEGORY_ID`
    )
    AND (`b`.`STATUS` = 1)
    AND (
      `c`.`BUSINESS_PRODUCT_CATEGORY_ID` = `b`.`BUSINESS_PRODUCT_CATEGORY_ID`
    )
    AND (
      `c`.`BUSINESS_PRODUCT_TAG_ID` = `d`.`BUSINESS_PRODUCT_TAG_ID`
    )
    AND (
      `d`.`BUSINESS_PRODUCT_TAG_ID` = `e`.`BUSINESS_PRODUCT_TAG_ID`
    )
    AND (
      `e`.`BUSINESS_PRODUCT_ID` = `f`.`BUSINESS_PRODUCT_ID`
    )
    AND (`x`.`BUSINESS_ID` = `f`.`BUSINESS_ID`)
    AND (`f`.`STATUS` = 1)
  )
ORDER BY
  `y`.`BUSINESS_FOOD_MENU_CARD_ID`,
  `z`.`DISPLAY_ORDER`;

CREATE OR REPLACE VIEW `business_having_active_menu_card_view` AS
SELECT
  DISTINCT `a`.`BUSINESS_ID` AS `BUSINESS_ID`
FROM
  `foodeez`.`business_food_menu_card` `a`
WHERE
  (
    (`a`.`VALID_FROM` <= NOW())
    AND (IFNULL(`a`.`VALID_TO`, NOW()) >= NOW())
    AND (IFNULL(`a`.`STATUS`, 1) = 1)
  );
