import AnalyticsApp from 'components/main-app/analytics-app/AnalyticsApp';

const hardCodedId = {
  id: '6632fecd27edcd0b89e4a3793e881c9f354f9f63',
  clientEmail: 'test-service-account@modified-link-377818.iam.gserviceaccount.com',
  clientId: '112683912808213538524',
  projectId: 'modified-link-377818',
};

const hardCodedKey = {
  type: 'service_account',
  project_id: 'modified-link-377818',
  private_key_id: '6632fecd27edcd0b89e4a3793e881c9f354f9f63',
  private_key:
    '-----BEGIN PRIVATE KEY-----\nMIIEugIBADANBgkqhkiG9w0BAQEFAASCBKQwggSgAgEAAoIBAQCnBRB/OB23CtOu\nHRu/tkZQNBBURQBruyPl6kJIxlIYd4TJXLkJ95k3ZMOYdP5+1tHzlbyZxnmAcP13\nZeckRgIiOMnGjTr7OAbfZptTBE19rzB1GGVn7CWj6pCLGvkN2P9wE/GZn5WSSLHB\njCP770fE7exkQvqw/84xEO+gSy8E7F2sWIGcgCmzz63Z6v0Dgg8XG8NUZ1+mFjdS\n3pv/fH6mniSGAEoPbRjot556zxOGSAe0/mp86GUcmEZvjkr957nKKssOhq2exRhI\ngg+21PDTX+kOTDGU6szHWeo7HfKgzHxxNr8muNMSJfM8EyE6nS+MBX8jM5xH4pOP\nj5vBXUZnAgMBAAECgf8xBrA4iwm1HoEbb7T6i6wSV7Sboz4DknJ4l6+37EtSQjBn\nqQPelbWUzE/DUSQmyaXxRO64vvREl1N5Yoc6dN9WnHow3JG1zXo8uoiYcR3x+oNv\nxM2jaPBEqRSCoRH7zba6YGJ5p1XY0Xgfy0J/xYluKEZVg/qLTascD29QKDHHoYIR\nqKEdN6OSt0EkyCWBi95ioa7GZEHOesVVWMkU+iEjtbhjnZqLjyQFitszm5tSf5VV\n05M6eAF9EZ3+3K2J7CYiBfokwjLs8aor451Vjcj3YN3gMKSaA2obfL8joF7Tj48G\nWucepfHThbsRZO6/NpFLV1p0QHwFKCvCCW2reAECgYEA5bRzgNrSiILNGQJ6zdO7\nHZjB/byIua+H49WoTQ79tcWM1qIlSyiqPR8YrmgPkhWuNwsppElm2MFAdVADANpQ\nxet0ees8gAj9/LdbEd5ssYOAq/NDwo0tryyuNxeUKdsNbhnRYmrzGan2xOhI66QB\ncVRbwRKRaG2MtjhHLU32XwcCgYEAuiOdCRIzVQF8US+ouhJuWxDu+cIuWQoEjO4c\n3rQjAJjPrT8mu6yZSZ4baUBmx9c1lOehmKfL9zhLZjl4sG3erUAxMhmp7gxy4Grw\nrW3XzYo5dBY1SeI2BIrQXo4OhGWsrB3kAEiOMaqJMBFCPugGk3SHYg3YMRa781WU\nd2l0paECgYBE6T7hgEQ62erHvvuydfujpGlGQuJNuoAs9LMZ8w5gEtTuqxQ/GQMB\ndSvFXsiVDdYHA11JwQ+OpWM+DnPoNJaY2ctGrDCpRIlV4Hf8w1qeYpIeg8tnOU1k\nSSY2tucnK2U7C5nKScWGhHvYlMsTjk80fZdNM9HVn0/gdr+7srDfzwKBgGq089c5\nadf3bA8WpUFWQ5FNGdJwMSW2CnnIHyDEX7R95cBJjajU/2Mmkkw6MTGq+/qK9yaO\nOu1UhlTp6Xgq5Bap0AoKkFH5LPneFG83oxkffmRAPvhGB/V+pokuIsBfkSdyUzye\nW3W5b7/whOuPFAYALYRWr3Mkt0Z97witmcNBAoGAH8ZnBKyFslhDsQJhZIeAsh1P\ngbzT4kYhPemPk75QUscO+oRzYuyZ3+HMVfmv/NfaOrNlz4OzgsfZ49PtqBQP2Rgv\ncZZSlUaC5uBA3UzTcxjKXF1LFbAYmFphwQssS5r3ZswbSBzhjv29mNWTYdR2CrNk\ni9s2bdLmG+MGjt8Mjz0=\n-----END PRIVATE KEY-----\n',
  client_email: 'test-service-account@modified-link-377818.iam.gserviceaccount.com',
  client_id: '112683912808213538524',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/test-service-account%40modified-link-377818.iam.gserviceaccount.com',
};

// all of this info is a prop here.....
const Sidebar = () => {
  return (
    <AnalyticsApp
      serviceAccountKeyId={hardCodedId}
      serviceAccountKey={hardCodedKey}
      propertyId="354125506"
    />
  );
};

export default Sidebar;
