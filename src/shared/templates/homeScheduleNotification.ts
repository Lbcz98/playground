/**
 * Home · Programação + Notificação — nível 1, the schedule rail on the left while
 * a notification shows in the top-right corner.
 *
 * The schedule Home (`home-schedule`) with the notification row of
 * `home-notification` on top: the column spreads (`justify: between`), the
 * notification at the top and the rail with the menu at the bottom. Its overlay is
 * the `home-buttons-left-notification` model — the left rail's shades plus the
 * notification's corner. Focus stays on the Schedule button; a notification does
 * not take it.
 */

import { homeNotificationTemplate } from './homeNotification'
import { homeScheduleTemplate } from './homeSchedule'
import type { ScreenTemplate } from './types'

const schedule = homeScheduleTemplate.blueprint.root
const notificationRow = homeNotificationTemplate.blueprint.root.children![0]

export const homeScheduleNotificationTemplate: ScreenTemplate = {
  id: 'home-schedule-notification',
  name: 'Home · Programação + Notificação',
  when: 'Home with a left rail (schedule, miscellaneous or login) while a notification shows in the top-right corner — focus stays on the left menu button.',
  blueprint: {
    version: 1,
    screen: { model: 'home-buttons-left-notification', level: 1 },
    root: {
      ...schedule,
      props: { ...schedule.props, justify: 'between' },
      children: [notificationRow, ...schedule.children!],
    },
  },
}
