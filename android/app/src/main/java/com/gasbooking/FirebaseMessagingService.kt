package com.gasbooking

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val CHANNEL_ID = "gas_booking_channel"
        private const val CHANNEL_NAME = "Gas Booking Notifications"
        private const val CHANNEL_DESCRIPTION = "Notifications for order updates and promotions"
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        // Show notification for both data-only and notification payloads
        // (foreground + background - no notification should be missed)
        sendNotification(remoteMessage)
    }

    override fun onNewToken(token: String) {
        // Send token to your server if needed
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val importance = NotificationManager.IMPORTANCE_HIGH
            
            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance).apply {
                description = CHANNEL_DESCRIPTION
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
            }
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    private fun sendNotification(remoteMessage: RemoteMessage) {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            // Add data from notification
            remoteMessage.data.forEach { (key, value) ->
                putExtra(key, value)
            }
            // Add message_id for RNFB getInitialNotification / onNotificationOpenedApp
            remoteMessage.messageId?.let { putExtra("google.message_id", it) }
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        
        // Try to use app icon, fallback to default if not available
        val iconResId = resources.getIdentifier("ic_launcher", "mipmap", packageName)
        val smallIcon = if (iconResId != 0) iconResId else android.R.drawable.ic_dialog_info
        
        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(smallIcon)
            .setContentTitle(remoteMessage.notification?.title ?: remoteMessage.data["title"] ?: "New Notification")
            .setContentText(remoteMessage.notification?.body ?: remoteMessage.data["body"] ?: "")
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Use a unique ID for each notification
        val notificationId = System.currentTimeMillis().toInt()
        notificationManager.notify(notificationId, notificationBuilder.build())
    }
}
