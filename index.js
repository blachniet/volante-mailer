const nodemailer = require('nodemailer');

//
// Class manages a nodemailer connection and sends email messages based on
// Volante events.
//
module.exports = {
	name: 'VolanteMailer',
	props: {
		enabled: true,
		testAccount: false,
		transport: null,
  },
  stats: {
  	sentEmails: 0,
  },
	events: {
	  'VolanteMailer.send'(msg, callback) {
      this.sendMessage(msg, callback);
	  }
  },
  data() {
		return {
	    transporter: null,
		};
  },
	updated() {
		if (this.testAccount) {
			this.$debug('creating test account using ethereal mail');
			nodemailer.createTestAccount((err, account) => {
				if (err) {
					return this.$error('error creating ethereal mail test account', err);
				}
				this.$log(`created test account with user: ${account.user}, pass: ${account.pass}`);
				this.transport = {
					host: 'smtp.ethereal.email',
					port: 587,
					secure: false,
					auth: {
							user: account.user,
							pass: account.pass,
					}
				};
				this.initializeTransporter();
			});
		} else {
		  this.initializeTransporter();
		}
	},
	methods: {
	  initializeTransporter() {
			if (this.enabled && this.transport && this.transport.host && this.transport.port && this.transport.auth) {
				this.$debug('initializing transporter', this.transport);
	      try {
	      	this.transporter = nodemailer.createTransport(this.transport);

					this.transporter.verify((err, success) => {
						if (err) {
							return this.$error('error verifying node mailer smtp transporter', err);
						}
						this.$ready(`SMTP transporter at ${this.transport.host} verified`);
					});

	      } catch (e) {
		  		console.error('error initializing nodemailer transporter', e);
		  	}
			} else {
				this.$warn('missing required nodemailer transport parameters, need transport: {host, port, auth}');
			}
	  },
	  sendMessage(msg, callback) {
	  	if (this.enabled) {
				if (msg.from && msg.to && msg.subject && (msg.text || msg.html)) {
		  		this.transporter.sendMail(msg, callback);
		  		this.sentEmails++;
				} else {
					this.$warn('msg missing required fields, need {from, to, subject, text || html}');
				}
	  	} else {
	  		this.$warn('not enabled');
	  	}
	  }
	},
};

if (require.main === module) {
	console.log('running test volante wheel');
	const volante = require('volante');

	let hub = new volante.Hub().debug();

	hub.attachAll().attachFromObject(module.exports);

}