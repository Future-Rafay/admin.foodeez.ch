SELECT
  `a`.`CNT` AS `CNT`,
  `a`.`Business_category_id` AS `BUSINESS_CATEGORY_ID`,
  `a`.`Category_name` AS `CATEGORY_NAME`,
(
    CASE
      WHEN (
        length(
          substr(
            `a`.`Category_name`,
            1,
            locate(' ', `a`.`Category_name`)
          )
        ) = 0
      ) THEN REPLACE(`a`.`Category_name`, '-', ' ')
      ELSE REPLACE(
        substr(
          `a`.`Category_name`,
          1,
          locate(' ', `a`.`Category_name`)
        ),
        '-',
        ' '
      )
    END
  ) AS `CATEGORY`
FROM
  (
    SELECT
      count(1) AS `CNT`,
      `foodeez`.`business_2_business_category_view`.`BUSINESS_CATEGORY_ID` AS `Business_category_id`,
      `foodeez`.`business_2_business_category_view`.`CATEGORY_NAME` AS `Category_name`
    FROM
      `foodeez`.`business_2_business_category_view`
    GROUP BY
      `foodeez`.`business_2_business_category_view`.`BUSINESS_CATEGORY_ID`,
      `foodeez`.`business_2_business_category_view`.`CATEGORY_NAME`
  ) `a`
ORDER BY
  `a`.`CNT` DESC