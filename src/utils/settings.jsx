import { db } from "../api/db";

export async function getSettingsFromDB(user=null) {
    const result = await db.getSettings(user);

    result.data.footer_messages.forEach(m => {
        m.active = m.active ?? false;
    })

    result.data.movies.forEach(m => {
        m.active = m.active ?? false;
        m.times = m.times ?? 1;
    })

    return result;
}
