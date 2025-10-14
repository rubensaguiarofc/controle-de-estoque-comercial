# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# === Capacitor / Plugins / WebView ===
# Mantém classes do Capacitor e plugins (anotações usadas em runtime via reflexão)
-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * { @com.getcapacitor.annotation.CapacitorPlugin *; }
-keep class com.rubensaguiarofc.controleestoque.MediaStoreSaver { *; }

# Preserva métodos JavaScriptInterface usados pelo WebView
-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }

# Evita remoção de classes do AndroidX essenciais
-keep class androidx.core.** { *; }
-keep class androidx.appcompat.** { *; }

# Otimização: permitir remoção de logs
-assumenosideeffects class android.util.Log {
	public static *** d(...);
	public static *** v(...);
	public static *** i(...);
	public static *** w(...);
}

# Mantém nomes de assets (não ofuscar caminhos usados em ponte Web → nativo)
-keepattributes SourceFile,LineNumberTable
