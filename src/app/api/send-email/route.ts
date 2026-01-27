const emailTemplates = {
    invitation: `
    <div style='font-family: Arial, sans-serif;'>
        <h1>You're Invited!</h1>
        <p>We are pleased to invite you to our platform. Here are some details:</p>
        <ul>
            <li><strong>Event:</strong> {{event}}</li>
            <li><strong>Date:</strong> {{date}}</li>
            <li><strong>Location:</strong> {{location}}</li>
        </ul>
        <p>Please click <a href='{{link}}'>here</a> to accept the invitation.</p>
    </div>`,

    tenantInvitation: `
    <div style='font-family: Arial, sans-serif;'>
        <h1>Welcome to Your New Home!</h1>
        <p>Dear Tenant,</p>
        <p>We are excited to invite you to join the KeyhomeKey community! Below are the details of your new property:</p>
        <h2>Property Details</h2>
        <ul>
            <li><strong>Property Address:</strong> {{propertyAddress}}</li>
            <li><strong>Owner's Name:</strong> {{ownerName}}</li>
            <li><strong>Contact Number:</strong> {{ownerContact}}</li>
        </ul>
        <h2>Setup Instructions</h2>
        <p>To get started, please follow these instructions:</p>
        <ol>
            <li>Check your email for confirmation.</li>
            <li>Visit our website to complete your profile.</li>
            <li>Contact your property owner if you have any questions.</li>
        </ol>
        <h2>KeyhomeKey Benefits</h2>
        <ul>
            <li>Seamless communication with your landlord.</li>
            <li>Easy access to property management services.</li>
            <li>Exclusive offers and discounts for tenants.</li>
        </ul>
        <p>If you have any questions, feel free to reach out!</p>
        <p>Best Regards,<br/>The KeyhomeKey Team</p>
    </div>`,
};

export default emailTemplates;