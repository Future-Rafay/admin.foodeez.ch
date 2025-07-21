SELECT
  `foodeez`.`top_events`.`TOP_EVENTS_ID` AS `TOP_EVENTS_ID`,
  `foodeez`.`top_events`.`TITLE` AS `TITLE`,
  `foodeez`.`top_events`.`ADDRESS` AS `ADDRESS`,
  `foodeez`.`top_events`.`DATE_1` AS `DATE_1`,
  `foodeez`.`top_events`.`TIME_1_FROM` AS `TIME_1_FROM`,
  `foodeez`.`top_events`.`TIME_1_TO` AS `TIME_1_TO`,
  `foodeez`.`top_events`.`DATE_2` AS `DATE_2`,
  `foodeez`.`top_events`.`TIME_2_FROM` AS `TIME_2_FROM`,
  `foodeez`.`top_events`.`TIME_2_TO` AS `TIME_2_TO`,
  `foodeez`.`top_events`.`DATE_3` AS `DATE_3`,
  `foodeez`.`top_events`.`TIME_3_FROM` AS `TIME_3_FROM`,
  `foodeez`.`top_events`.`TIME_3_TO` AS `TIME_3_TO`,
  `foodeez`.`top_events`.`DATE_4` AS `DATE_4`,
  `foodeez`.`top_events`.`TIME_4_FROM` AS `TIME_4_FROM`,
  `foodeez`.`top_events`.`TIME_4_TO` AS `TIME_4_TO`,
  `foodeez`.`top_events`.`DATE_5` AS `DATE_5`,
  `foodeez`.`top_events`.`TIME_5_FROM` AS `TIME_5_FROM`,
  `foodeez`.`top_events`.`TIME_5_TO` AS `TIME_5_TO`,
  `foodeez`.`top_events`.`HREF` AS `HREF`
FROM
  `foodeez`.`top_events`
WHERE
  (`foodeez`.`top_events`.`DATE_1` >= curdate())
ORDER BY
  `foodeez`.`top_events`.`DATE_1`