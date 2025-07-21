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
  IFNULL(
    `f`.`PIC`,
    'https://shining-fun-cae9b3168c.media.strapiapp.com/NOT_AVAILABLE_f2715698fd.jpg'
  ) AS `PIC`
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
    AND (
      `y`.`BUSINESS_FOOD_MENU_CARD_ID` = `z`.`BUSINESS_FOOD_MENU_CARD_ID`
    )
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
  `z`.`DISPLAY_ORDER`