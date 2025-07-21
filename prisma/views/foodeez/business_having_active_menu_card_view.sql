SELECT
  DISTINCT `a`.`BUSINESS_ID` AS `BUSINESS_ID`
FROM
  `foodeez`.`business_food_menu_card` `a`
WHERE
  (
    (`a`.`VALID_FROM` <= NOW())
    AND (IFNULL(`a`.`VALID_TO`, NOW()) >= NOW())
  )