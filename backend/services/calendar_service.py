from datetime import datetime, timedelta
import uuid

class CalendarService:
    """Service for generating calendar invite (.ics) files"""

    def generate_ics(
        self,
        title: str,
        description: str,
        start_time: datetime,
        duration_minutes: int,
        organizer_email: str = "recruiting@company.com",
        organizer_name: str = "Recruiting Team",
        attendee_email: str = None,
        attendee_name: str = None,
        location: str = None,
        meeting_link: str = None
    ) -> str:
        """
        Generate an iCalendar (.ics) format string for a meeting invite

        Returns: String content of .ics file that can be sent as email attachment
        """

        # Calculate end time
        end_time = start_time + timedelta(minutes=duration_minutes)

        # Generate unique UID for the event
        event_uid = str(uuid.uuid4())

        # Format timestamps in iCalendar format (YYYYMMDDTHHMMSSZ)
        def format_datetime(dt):
            return dt.strftime('%Y%m%dT%H%M%SZ')

        # Prepare location/meeting link
        event_location = location or meeting_link or "TBD"

        # Build description with meeting link if provided
        full_description = description or ""
        if meeting_link:
            full_description += f"\\n\\nJoin Meeting: {meeting_link}"

        # Escape special characters for iCalendar format
        def escape_text(text):
            if not text:
                return ""
            return text.replace('\\', '\\\\').replace(';', '\\;').replace(',', '\\,').replace('\n', '\\n')

        title_escaped = escape_text(title)
        description_escaped = escape_text(full_description)
        location_escaped = escape_text(event_location)

        # Build attendee line if provided
        attendee_line = ""
        if attendee_email:
            attendee_cn = escape_text(attendee_name) if attendee_name else attendee_email
            attendee_line = f"ATTENDEE;CN={attendee_cn};RSVP=TRUE:mailto:{attendee_email}\n"

        # Generate .ics content
        ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TalentScout X//Meeting Scheduler//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:{event_uid}
DTSTAMP:{format_datetime(datetime.utcnow())}
DTSTART:{format_datetime(start_time)}
DTEND:{format_datetime(end_time)}
SUMMARY:{title_escaped}
DESCRIPTION:{description_escaped}
LOCATION:{location_escaped}
ORGANIZER;CN={escape_text(organizer_name)}:mailto:{organizer_email}
{attendee_line}STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder: {title_escaped} in 15 minutes
END:VALARM
END:VEVENT
END:VCALENDAR"""

        return ics_content

    def create_calendar_message(
        self,
        candidate_name: str,
        event_title: str,
        event_date: str,
        event_time: str,
        duration: int,
        meeting_type: str,
        meeting_link: str = None
    ) -> str:
        """
        Create a friendly message to send with the calendar invite
        """

        meeting_details = f"{meeting_type.capitalize()} call"
        if meeting_link:
            meeting_details = f"[{meeting_type.capitalize()} call]({meeting_link})"

        message = f"""Hi {candidate_name}!

I've scheduled our interview for {event_date} at {event_time} ({duration} minutes).

Meeting Details:
• Type: {meeting_details}
• Duration: {duration} minutes
"""

        if meeting_link:
            message += f"• Join Link: {meeting_link}\n"

        message += f"""
A calendar invite has been sent to help you keep track of our meeting.

Looking forward to speaking with you!"""

        return message
