type Schedule = {
  name: string;
  cronDate: CronDate;
  station: string;
  duration: number;
  title: string;
  personality: string;
}

export const schedules: Schedule[] = [
  {
    name: "bakadikara",
    cronDate: { min: 59, hour: 0, dayOfWeek: "TUE"},
    station: "TBS",
    duration: 122,
    title: "伊集院光深夜の馬鹿力",
    personality: "伊集院光",
  },
  {
    name: "cowboy",
    cronDate: { min: 59, hour: 0, dayOfWeek: "WED"},
    station: "TBS",
    duration: 122,
    title: "爆笑問題カーボーイ",
    personality: "爆笑問題",
  },
  {
    name: "bananamoon",
    cronDate: { min: 59, hour: 0, dayOfWeek: "SAT"},
    station: "TBS",
    duration: 122,
    title: "バナナムーン",
    personality: "バナナマン",
  },
  {
    name: "elekata_ketsubi",
    cronDate: { min: 59, hour: 0, dayOfWeek: "SUN"},
    station: "TBS",
    duration: 62,
    title: "エレ片のケツビ",
    personality: "エレキコミック・片桐仁",
  },
  {
    name: "america_nagaremono",
    cronDate: { min: 55, hour: 14, dayOfWeek: "TUE"},
    station: "TBS",
    duration: 36,
    title: "町山智浩アメリカ流れ者",
    personality: "町山智浩",
  },
  {
    name: "after6junction2",
    cronDate: { min: 59, hour: 21, dayOfWeek: ["MON", "TUE", "WED", "THU"]},
    station: "TBS",
    duration: 92,
    title: "アフター6ジャンクション2",
    personality: "ライムスター宇多丸",
  },
  {
    name: "sayonara_cityboys",
    cronDate: { min: 59, hour: 18, dayOfWeek: "SAT"},
    station: "QRR",
    duration: 32,
    title: "SAYONARAシティボーイズ",
    personality: "シティボーイズ",
  },
  {
    name: "100years_radio",
    cronDate: { min: 59, hour: 10, dayOfWeek: "SUN"},
    station: "JOAK-FM",
    duration: 52,
    title: "伊集院光の百年ラヂオ",
    personality: "伊集院光",
  },
  {
    name: "ijuuin_no_tane",
    cronDate: { min: 29, hour: 17, dayOfWeek: ["TUE", "WED", "THU", "FRI"]},
    station: "LFR",
    duration: 52,
    title: "伊集院光のタネ",
    personality: "伊集院光",
  },
]

export function commandFromSchedule(schedule: Schedule): string[] {
  return ["deno", "task", "run", "-s", schedule.station, "-d", String(schedule.duration), "-t", schedule.title, "-a", schedule.personality]
}

type CronDate = { min: number; hour: number; dayOfWeek: DayOfWeek };
type SingleDayOfWeek = "SUN"| "MON"| "TUE"| "WED"| "THU"| "FRI"| "SAT"
type MultiDayOfWeek = SingleDayOfWeek[];
type DayOfWeek = SingleDayOfWeek | MultiDayOfWeek;

export function cronExpression(cronDate: CronDate): string {
  const dayOfWeek = Array.isArray(cronDate.dayOfWeek) ? cronDate.dayOfWeek.join(",") : cronDate.dayOfWeek;
  return `cron(${cronDate.min} ${cronDate.hour} ? * ${dayOfWeek} *)`
}

export function jstToUtc(jst: CronDate): CronDate {
  const utcHour = jst.hour - 9;
  if (utcHour < 0) {
    return {
      min: jst.min,
      hour: utcHour + 24,
      dayOfWeek: Array.isArray(jst.dayOfWeek) ? jst.dayOfWeek.map(beforeDayOfWeek) : beforeDayOfWeek(jst.dayOfWeek),
    };
  }
  return {
    min: jst.min,
    hour: utcHour,
    dayOfWeek: jst.dayOfWeek,
  };
}

function beforeDayOfWeek(dayOfWeek: SingleDayOfWeek): SingleDayOfWeek {
  switch (dayOfWeek) {
    case "SUN":
      return "SAT";
    case "MON":
      return "SUN";
    case "TUE":
      return "MON";
    case "WED":
      return "TUE";
    case "THU":
      return "WED";
    case "FRI":
      return "THU";
    case "SAT":
      return "FRI";
    default:
      throw new Error("never");
  }
}
